#!/bin/bash
set -uo pipefail
# NOTE: We intentionally do NOT use `set -e` because we handle errors manually
# per-stage via the `run_stage` function and status file mechanism.

# =============================================================================
# ChitChatLearn Deployment Script (v2 - with status file for notifications)
# =============================================================================
# Usage:
#   deploy.sh <project_path>                      - Full deployment
#   deploy.sh <project_path> --health-check-only  - Only run health check
#   deploy.sh <project_path> --rollback            - Rollback to previous images
#
# Writes deployment status to /tmp/chitchatlearn_deploy_status with:
#   STATUS, STAGE, ERROR, ROLLBACK, DURATION, SERVICES, LAST_OUTPUT (base64)
# =============================================================================

PROJECT_PATH="${1:?Error: PROJECT_PATH is required as first argument}"
ACTION="${2:-deploy}"
BACKEND_DIR="$PROJECT_PATH/backend"
COMPOSE_CMD="docker compose"
STATUS_FILE="/tmp/chitchatlearn_deploy_status"
DEPLOY_START_TIME=$(date +%s)

# Capture buffer for last output
LAST_OUTPUT_FILE="/tmp/chitchatlearn_deploy_output"
> "$LAST_OUTPUT_FILE"

# Colors for logging (when running interactively)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $(date '+%H:%M:%S') $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $(date '+%H:%M:%S') $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $*"; }

# -----------------------------------------------------------------------------
# Status file helpers
# -----------------------------------------------------------------------------
write_status() {
    local status="$1"
    local stage="${2:-}"
    local error="${3:-}"
    local rollback="${4:-not_attempted}"

    local end_time
    end_time=$(date +%s)
    local duration=$(( end_time - DEPLOY_START_TIME ))

    # Get service statuses (only if docker is reachable)
    local services=""
    if [ -d "$BACKEND_DIR" ]; then
        services=$($COMPOSE_CMD -f "$BACKEND_DIR/docker-compose.yml" ps --format '{{.Service}}:{{.State}}:{{.Status}}' 2>/dev/null | tr '\n' '|' || echo "")
    fi

    # Base64 encode last output (last 5 lines from the output file)
    local last_output_b64=""
    if [ -f "$LAST_OUTPUT_FILE" ]; then
        last_output_b64=$(tail -n 5 "$LAST_OUTPUT_FILE" | base64 -w 0 2>/dev/null || tail -n 5 "$LAST_OUTPUT_FILE" | base64 2>/dev/null || echo "")
    fi

    # Write status file atomically (write to temp, then mv)
    local tmp_status="${STATUS_FILE}.tmp"
    cat > "$tmp_status" <<EOF
STATUS=${status}
STAGE=${stage}
ERROR=${error}
ROLLBACK=${rollback}
DURATION=${duration}
SERVICES=${services}
LAST_OUTPUT=${last_output_b64}
EOF
    mv "$tmp_status" "$STATUS_FILE"
}

# Run a command within a named stage, capturing output and handling errors.
# Usage: run_stage <stage_name> <human_description> <command...>
# Returns: 0 on success, 1 on failure (and writes status file on failure)
run_stage() {
    local stage_name="$1"
    local description="$2"
    shift 2

    log_info "[$stage_name] $description"

    # Run the command, capture output to file and display it
    local stage_output
    stage_output=$("$@" 2>&1) || {
        local exit_code=$?
        # Save output for status file
        echo "$stage_output" >> "$LAST_OUTPUT_FILE"
        echo "$stage_output"
        log_error "[$stage_name] Failed with exit code $exit_code"
        write_status "failure" "$stage_name" "$description failed (exit code $exit_code)"
        return 1
    }

    # On success, still save and display output
    echo "$stage_output" >> "$LAST_OUTPUT_FILE"
    echo "$stage_output"
    return 0
}

# -----------------------------------------------------------------------------
# Health check function
# -----------------------------------------------------------------------------
health_check() {
    local max_attempts=12
    local wait_seconds=5
    local attempt=1

    log_info "Running health check (max ${max_attempts} attempts, ${wait_seconds}s interval)..."

    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
            log_info "Health check passed on attempt $attempt"
            return 0
        fi
        log_warn "Health check attempt $attempt/$max_attempts failed, waiting ${wait_seconds}s..."
        sleep $wait_seconds
        attempt=$((attempt + 1))
    done

    log_error "Health check failed after $max_attempts attempts ($(( max_attempts * wait_seconds ))s)"
    return 1
}

# -----------------------------------------------------------------------------
# Rollback function (used internally and as a standalone action)
# -----------------------------------------------------------------------------
do_rollback() {
    log_info "=== ROLLBACK STARTED ==="
    cd "$BACKEND_DIR" || return 1

    if docker image inspect backend-backend:rollback > /dev/null 2>&1; then
        log_info "Restoring rollback images..."
        docker tag backend-backend:rollback backend-backend:latest
        docker tag backend-celery_worker:rollback backend-celery_worker:latest 2>/dev/null || true
        docker tag backend-celery_beat:rollback backend-celery_beat:latest 2>/dev/null || true

        log_info "Restarting services with rollback images..."
        $COMPOSE_CMD up -d --no-deps --no-build backend celery_worker celery_beat

        log_info "Waiting for services to stabilize..."
        sleep 10

        if health_check; then
            log_info "=== ROLLBACK SUCCESSFUL ==="
            return 0
        else
            log_error "=== ROLLBACK FAILED - Manual intervention required ==="
            return 1
        fi
    else
        log_error "No rollback images found. Manual intervention required."
        return 1
    fi
}

# -----------------------------------------------------------------------------
# Health check only mode
# -----------------------------------------------------------------------------
if [ "$ACTION" = "--health-check-only" ]; then
    health_check
    exit $?
fi

# -----------------------------------------------------------------------------
# Rollback mode (standalone)
# -----------------------------------------------------------------------------
if [ "$ACTION" = "--rollback" ]; then
    if do_rollback; then
        write_status "success" "rollback" "" "success"
        exit 0
    else
        write_status "failure" "rollback" "Rollback failed" "failed"
        exit 1
    fi
fi

# -----------------------------------------------------------------------------
# Full deployment
# -----------------------------------------------------------------------------
log_info "=== DEPLOYMENT STARTED ==="
log_info "Project path: $PROJECT_PATH"

# Clear previous output capture
> "$LAST_OUTPUT_FILE"

# Step 1: Pull latest code
if ! run_stage "git_pull" "Pulling latest code from dev" bash -c "
    cd '$PROJECT_PATH' &&
    git fetch origin dev &&
    git checkout dev &&
    git reset --hard origin/dev
"; then
    # No rollback needed — code hasn't changed yet
    # (run_stage already wrote the status file)
    exit 1
fi

# Step 2: Tag current images for rollback
log_info "[image_tag] Tagging current images for rollback..."
cd "$BACKEND_DIR"
if docker image inspect backend-backend:latest > /dev/null 2>&1; then
    docker tag backend-backend:latest backend-backend:rollback
    docker tag backend-celery_worker:latest backend-celery_worker:rollback 2>/dev/null || true
    docker tag backend-celery_beat:latest backend-celery_beat:rollback 2>/dev/null || true
    log_info "Rollback images tagged"
else
    log_warn "No existing images to tag for rollback (first deployment)"
fi

# Step 3: Build new images
if ! run_stage "docker_build" "Building new Docker images" \
    $COMPOSE_CMD build --no-cache backend; then
    # Rollback not needed — old images are still tagged :latest
    exit 1
fi

# Step 4: Rolling restart - backend first
if ! run_stage "restart_backend" "Restarting backend service" \
    $COMPOSE_CMD up -d --no-deps --force-recreate backend; then
    # Backend failed to restart, attempt rollback
    log_info "Initiating rollback due to backend restart failure..."
    if do_rollback; then
        write_status "failure" "restart_backend" "Backend restart failed" "success"
    else
        write_status "failure" "restart_backend" "Backend restart failed" "failed"
    fi
    exit 1
fi

# Wait for backend to be healthy
log_info "Waiting for backend to be healthy..."
sleep 15

if ! run_stage "health_check" "Backend health check after restart" health_check; then
    log_info "Initiating rollback due to health check failure..."
    if do_rollback; then
        write_status "failure" "health_check" "Backend health check failed after restart" "success"
    else
        write_status "failure" "health_check" "Backend health check failed after restart" "failed"
    fi
    exit 1
fi

# Restart celery workers
if ! run_stage "restart_celery" "Restarting celery workers" bash -c "
    cd '$BACKEND_DIR' &&
    $COMPOSE_CMD up -d --no-deps --force-recreate celery_worker &&
    $COMPOSE_CMD up -d --no-deps --force-recreate celery_beat
"; then
    log_info "Initiating rollback due to celery restart failure..."
    if do_rollback; then
        write_status "failure" "restart_celery" "Celery worker restart failed" "success"
    else
        write_status "failure" "restart_celery" "Celery worker restart failed" "failed"
    fi
    exit 1
fi

# Step 5: Final verification
log_info "[verify] Final verification..."
sleep 5

RUNNING=$($COMPOSE_CMD ps --format '{{.Service}} {{.State}}' | grep -c "running" || true)
EXPECTED=5

if [ "$RUNNING" -ge "$EXPECTED" ]; then
    log_info "All $EXPECTED services are running"
else
    log_warn "Only $RUNNING/$EXPECTED services running"
    $COMPOSE_CMD ps
fi

# Clean up dangling images
log_info "Cleaning up dangling images..."
docker image prune -f > /dev/null 2>&1 || true

# Write success status
log_info "=== DEPLOYMENT SUCCESSFUL ==="
write_status "success" "complete" ""

log_info "Services status:"
$COMPOSE_CMD ps --format 'table {{.Service}}\t{{.Status}}'
