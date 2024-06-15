# Stage 1: Build the static site with Node.js
FROM node:16 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock/pnpm-lock.yaml)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build the static files
RUN npm run build

# Stage 2: Serve the site with nginx
FROM nginx:alpine

# Copy static assets from builder stage
COPY --from=builder /app/out /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
