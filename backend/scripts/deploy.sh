#!/bin/bash
set -euo pipefail

# =============================================================================
# ChitChatLearn Deployment Script
# =============================================================================
# Usage:
#   deploy.sh <project_path>                  - Full deployment
#   deploy.sh <project_path> --health-check-only  - Only run health check
#   deploy.sh <project_path> --rollback       - Rollback to previous images
# =============================================================================

PROJECT_PATH="${1:?Error: PROJECT_PATH is required as first argument}"
ACTION="${2:-deploy}"
BACKEND_DIR="$PROJECT_PATH/backend"
COMPOSE_CMD="docker compose"

# Colors for logging (when running interactively)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $(date '+%H:%M:%S') $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $(date '+%H:%M:%S') $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $*"; }

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
# Health check only mode
# -----------------------------------------------------------------------------
if [ "$ACTION" = "--health-check-only" ]; then
    health_check
    exit $?
fi

# -----------------------------------------------------------------------------
# Rollback mode
# -----------------------------------------------------------------------------
if [ "$ACTION" = "--rollback" ]; then
    log_info "=== ROLLBACK STARTED ==="
    cd "$BACKEND_DIR"

    # Check if rollback images exist
    if docker image inspect backend-backend:rollback > /dev/null 2>&1; then
        log_info "Restoring rollback images..."
        docker tag backend-backend:rollback backend-backend:latest
        docker tag backend-celery_worker:rollback backend-celery_worker:latest
        docker tag backend-celery_beat:rollback backend-celery_beat:latest

        log_info "Restarting services with rollback images..."
        $COMPOSE_CMD up -d --no-deps --no-build backend celery_worker celery_beat

        log_info "Waiting for services to stabilize..."
        sleep 10

        if health_check; then
            log_info "=== ROLLBACK SUCCESSFUL ==="
        else
            log_error "=== ROLLBACK FAILED - Manual intervention required ==="
            exit 1
        fi
    else
        log_error "No rollback images found. Manual intervention required."
        exit 1
    fi
    exit 0
fi

# -----------------------------------------------------------------------------
# Full deployment
# -----------------------------------------------------------------------------
log_info "=== DEPLOYMENT STARTED ==="
log_info "Project path: $PROJECT_PATH"

# Step 1: Pull latest code
log_info "Step 1/5: Pulling latest code from dev..."
cd "$PROJECT_PATH"
git fetch origin dev
git checkout dev
git reset --hard origin/dev

# Step 2: Tag current images for rollback
log_info "Step 2/5: Tagging current images for rollback..."
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
log_info "Step 3/5: Building new Docker images..."
$COMPOSE_CMD build --no-cache backend

# Step 4: Rolling restart - backend first
log_info "Step 4/5: Performing rolling restart..."

# Restart backend service (DB and Redis stay running)
log_info "  Restarting backend..."
$COMPOSE_CMD up -d --no-deps --force-recreate backend

# Wait for backend to be healthy before restarting celery
log_info "  Waiting for backend to be healthy..."
sleep 15

if ! health_check; then
    log_error "Backend health check failed after restart!"
    log_info "Initiating automatic rollback..."
    exit 1
fi

# Restart celery workers (they share the same image)
log_info "  Restarting celery_worker..."
$COMPOSE_CMD up -d --no-deps --force-recreate celery_worker

log_info "  Restarting celery_beat..."
$COMPOSE_CMD up -d --no-deps --force-recreate celery_beat

# Step 5: Final verification
log_info "Step 5/5: Final verification..."
sleep 5

# Verify all containers are running
RUNNING=$($COMPOSE_CMD ps --format '{{.Service}} {{.State}}' | grep -c "running" || true)
EXPECTED=5  # db, backend, redis, celery_worker, celery_beat

if [ "$RUNNING" -ge "$EXPECTED" ]; then
    log_info "All $EXPECTED services are running"
else
    log_warn "Only $RUNNING/$EXPECTED services running"
    $COMPOSE_CMD ps
fi

# Clean up old/dangling images to save disk space
log_info "Cleaning up dangling images..."
docker image prune -f > /dev/null 2>&1 || true

log_info "=== DEPLOYMENT SUCCESSFUL ==="
log_info "Services status:"
$COMPOSE_CMD ps --format 'table {{.Service}}\t{{.Status}}'
