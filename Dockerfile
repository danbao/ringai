# ============================================
# Testring Dockerfile - Optimized for Testing
# ============================================
# This Dockerfile creates a minimal image for running tests.
# It uses multi-stage build to keep the final image small.

# --------------------------------------------
# Base stage - Build dependencies
# --------------------------------------------
FROM node:22-bookworm AS base

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# Install Playwright dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY core/package.json ./core/
COPY packages/*/package.json ./packages/


# --------------------------------------------
# Dependencies stage - Install all deps
# --------------------------------------------
FROM base AS deps

# Copy project files needed for dependency installation
COPY . .

# Install dependencies (including build dependencies)
RUN pnpm install --frozen-lockfile --ignore-scripts


# --------------------------------------------
# Builder stage - Build the project
# --------------------------------------------
FROM base AS builder

WORKDIR /app

# Copy dependency tree from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/core/node_modules ./core/node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/

# Copy source code
COPY . .

# Install Playwright browsers for testing
RUN pnpm exec playwright install --with-deps chromium

# Build the project (excluding e2e-test-app and devtool-frontend)
RUN pnpm run build:main


# --------------------------------------------
# Test runner stage - Run tests
# --------------------------------------------
FROM node:22-bookworm-slim AS test-runner

# Install runtime dependencies only
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# Install Playwright and its dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app .
COPY --from=builder /root/.cache /root/.cache
COPY --from=builder /root/.pnpm-store /root/.pnpm-store

# Set environment variables
ENV CI=true
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Default command runs tests
CMD ["pnpm", "run", "test:unit"]


# --------------------------------------------
# Minimal runner - For CI/CD
# --------------------------------------------
FROM test-runner AS ci

# Copy coverage tools
RUN pnpm add -g c8

# Run tests with coverage
CMD ["pnpm", "run", "test:unit:coverage"]


# --------------------------------------------
# Development runner - Interactive
# --------------------------------------------
FROM test-runner AS dev

# Install build tools for development
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install dev dependencies
RUN pnpm install

# Watch mode support
CMD ["pnpm", "run", "test:unit:watch"]
