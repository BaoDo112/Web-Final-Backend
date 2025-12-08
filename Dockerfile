# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma engine
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Delete dist build for swagger
RUN rm -rf dist

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install OpenSSL libraries for Prisma runtime
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production

# Copy built assets and dependencies from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create startup script that skips migration if it fails (for first run)
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "Running Prisma migrations..."' >> /app/start.sh && \
    echo 'npx prisma migrate deploy || npx prisma db push --accept-data-loss' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo 'node dist/main.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Start command (runs migration then starts app)
CMD ["/app/start.sh"]
