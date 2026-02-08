# Build stage
FROM node:20-slim AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files and build
COPY . .
RUN npm run build

# Final stage: Serve with Nginx
FROM nginx:stable-alpine

# Copy build files to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config if needed (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
