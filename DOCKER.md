# Testring Docker Guide

This guide explains how to use Docker with testring for development and CI/CD.

## Quick Start

### Run Tests in Docker

```bash
# Unit tests
docker compose run --rm test-unit

# E2E tests
docker compose run --rm test-e2e

# With coverage
docker compose run --rm ci
```

### Development Container

```bash
# Start development container
docker compose run --rm dev

# Inside container
pnpm install
pnpm run build:main
pnpm run test:unit:watch
```

## Docker Images

The Dockerfile supports multiple build targets:

| Target | Purpose | Use Case |
|--------|---------|----------|
| `test-runner` | Run tests | Default, for running test suites |
| `ci` | CI/CD | For GitHub Actions, includes coverage tools |
| `dev` | Development | Interactive development with hot reload |

## Build Images

```bash
# Build test-runner (default)
docker build -t testring:test .

# Build CI image
docker build -t testring:ci --target ci .

# Build dev image
docker build -t testring:dev --target dev .
```

## GitHub Actions

The project includes reusable workflows in `.github/workflows/templates/`:

- `test.yml` - Run test suite
- `docker.yml` - Build and push Docker images
- `publish.yml` - Publish packages to npm registry

Example usage in your workflow:

```yaml
jobs:
  test:
    uses: ./.github/workflows/templates/test.yml@main
    with:
      node-version: '22'
      run-coverage: true

  docker:
    uses: ./.github/workflows/templates/docker.yml@main
    with:
      image-name: testring
      target: ci
      push: true
    secrets:
      github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CI` | `false` | Enable CI mode |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | `0` | Skip browser download |
| `PLAYWRIGHT_BROWSERS_PATH` | `/ms-playwright` | Playwright browser path |

## Volume Mounts

For development, the following volumes are mounted:

- `.` → `/app` (project files)
- `node_modules` → cached node_modules
- `core_modules` → cached core node_modules
- `packages_modules` → cached packages node_modules

## Troubleshooting

### Playwright issues in Docker

If Playwright tests fail in Docker, try:

```bash
# Rebuild with browser support
docker build --target ci -t testring:ci .

# Run with extended shm
docker compose run --rm --shm-size=2gb test-e2e
```

### Memory issues

Increase Docker desktop memory to at least 4GB for E2E tests.

### Permission issues

```bash
# Fix node_modules ownership
docker compose run --rm dev chown -R node:node /app
```
