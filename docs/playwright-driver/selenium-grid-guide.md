# Selenium Grid Integration

This guide covers using Selenium Grid with `@ringai/plugin-playwright-driver` for distributed testing.

## Overview

Playwright can connect to Selenium Grid Hub to run Google Chrome or Microsoft Edge browsers, enabling distributed testing for:

- **Parallel Testing**: Run tests simultaneously on multiple machines
- **Cross-Platform Testing**: Run tests on different operating systems
- **Resource Management**: Centrally manage browser resources
- **Isolated Environments**: Run tests in containerized environments

## Quick Start

### Basic Configuration

```javascript
module.exports = {
    plugins: [
        ['@ringai/plugin-playwright-driver', {
            browserName: 'chromium', // Only chromium and msedge support Selenium Grid
            seleniumGrid: {
                gridUrl: 'http://selenium-hub:4444'
            }
        }]
    ]
};
```

### Environment Variables

```bash
export SELENIUM_REMOTE_URL=http://selenium-hub:4444
export SELENIUM_REMOTE_CAPABILITIES='{"browserName":"chrome","browserVersion":"latest"}'
export SELENIUM_REMOTE_HEADERS='{"Authorization":"Bearer your-token"}'
```

## Browser Support

### Supported Browsers

✅ **Chromium** - Uses Chrome nodes
```javascript
{
    browserName: 'chromium',
    seleniumGrid: {
        gridCapabilities: {
            'browserName': 'chrome'
        }
    }
}
```

✅ **Microsoft Edge** - Uses Edge nodes
```javascript
{
    browserName: 'msedge',
    seleniumGrid: {
        gridCapabilities: {
            'browserName': 'edge'
        }
    }
}
```

### Unsupported Browsers

❌ **Firefox** - Not supported by Selenium Grid
❌ **WebKit** - Not supported by Selenium Grid

## Docker Setup

### Quick Start with Docker Compose

Create `selenium-grid.yml`:

```yaml
version: '3.8'

services:
  selenium-hub:
    image: selenium/hub:latest
    container_name: selenium-hub
    ports:
      - "4444:4444"
    environment:
      - GRID_MAX_SESSION=16
      - GRID_BROWSER_TIMEOUT=300

  chrome:
    image: selenium/node-chrome:latest
    shm_size: 2gb
    depends_on:
      - selenium-hub
    environment:
      - HUB_HOST=selenium-hub
      - HUB_PORT=4444
```

### Usage

```bash
# Start Selenium Grid
docker-compose -f selenium-grid.yml up -d

# Check Grid status
curl http://localhost:4444/wd/hub/status

# Run tests
pnpm test

# Stop Grid
docker-compose -f selenium-grid.yml down
```

## Configuration Priority

Configuration priority order (from highest to lowest):

1. **Environment Variables** (highest priority)
   - `SELENIUM_REMOTE_URL`
   - `SELENIUM_REMOTE_CAPABILITIES`
   - `SELENIUM_REMOTE_HEADERS`

2. **Configuration Files**
   - `seleniumGrid.gridUrl`
   - `seleniumGrid.gridCapabilities`
   - `seleniumGrid.gridHeaders`

3. **Default Values** (lowest priority)

## 📊 Use Cases

### Scenario 1: Local Development Environment

```javascript
module.exports = {
    plugins: [
        ['@ringai/plugin-playwright-driver', {
            browserName: 'chromium',
            seleniumGrid: {
                gridUrl: 'http://localhost:4444',
                gridCapabilities: {
                    'browserName': 'chrome',
                    'platformName': 'linux'
                }
            }
        }]
    ]
};
```

### Scenario 2: CI/CD Environment

```javascript
module.exports = {
    plugins: [
        ['@ringai/plugin-playwright-driver', {
            browserName: 'chromium',
            seleniumGrid: {
                gridUrl: process.env.SELENIUM_GRID_URL || 'http://selenium-hub:4444',
                gridCapabilities: {
                    'browserName': 'chrome',
                    'browserVersion': 'latest',
                    'platformName': 'linux',
                    'build': process.env.BUILD_NUMBER,
                    'name': process.env.TEST_NAME
                },
                gridHeaders: {
                    'Authorization': `Bearer ${process.env.GRID_TOKEN}`
                }
            }
        }]
    ]
};
```

### Scenario 3: Cloud Selenium Grid Service

```javascript
module.exports = {
    plugins: [
        ['@ringai/plugin-playwright-driver', {
            browserName: 'chromium',
            seleniumGrid: {
                gridUrl: 'https://your-cloud-grid.com:4444',
                gridCapabilities: {
                    'browserName': 'chrome',
                    'browserVersion': 'latest',
                    'platformName': 'Windows 10',
                    // Cloud service specific configuration
                    'sauce:options': {
                        'username': process.env.SAUCE_USERNAME,
                        'accessKey': process.env.SAUCE_ACCESS_KEY
                    }
                }
            }
        }]
    ]
};
```

## 📝 Best Practices

### 1. Resource Management

```javascript
// Set appropriate concurrency to avoid resource exhaustion
module.exports = {
    workerLimit: 4, // Adjust based on Grid capacity
    plugins: [
        ['@ringai/plugin-playwright-driver', {
            // ... Grid configuration
        }]
    ]
};
```

### 2. Error Handling

```javascript
// Use retry mechanism to handle network issues
module.exports = {
    retryCount: 2,
    retryDelay: 1000,
    plugins: [
        ['@ringai/plugin-playwright-driver', {
            seleniumGrid: {
                // ... Grid configuration
            }
        }]
    ]
};
```

### 3. Timeout Configuration

```javascript
module.exports = {
    plugins: [
        ['@ringai/plugin-playwright-driver', {
            clientTimeout: 30 * 60 * 1000, // 30 minutes
            seleniumGrid: {
                gridCapabilities: {
                    'se:options': {
                        'sessionTimeout': 1800 // 30 minutes
                    }
                }
            }
        }]
    ]
};
```

### 4. Debug Configuration

```javascript
// Debug configuration for development environment
module.exports = {
    plugins: [
        ['@ringai/plugin-playwright-driver', {
            seleniumGrid: {
                gridCapabilities: {
                    'se:options': {
                        'args': process.env.NODE_ENV === 'development' 
                            ? ['--no-sandbox', '--disable-dev-shm-usage'] 
                            : ['--headless', '--no-sandbox']
                    }
                }
            },
            video: process.env.NODE_ENV === 'development',
            trace: process.env.NODE_ENV === 'development'
        }]
    ]
};
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Connection Failed
```
Error: getaddrinfo ENOTFOUND selenium-hub
```

**Solution**:
- Check if Grid URL is correct
- Confirm Selenium Grid service is running
- Check network connection

#### 2. Browser Not Supported
```
Error: Selenium Grid is not supported for Firefox
```

**Solution**:
- Only use `chromium` or `msedge` browsers
- Firefox and WebKit are not supported by Selenium Grid

#### 3. Session Creation Failed
```
Error: Could not start a new session
```

**Solution**:
- Check if Grid nodes have available capacity
- Verify capabilities configuration is correct
- Check authentication credentials

### Debugging Tips

#### 1. Check Grid Status

```bash
# Check Grid Hub status
curl http://localhost:4444/wd/hub/status

# View available nodes
curl http://localhost:4444/grid/api/hub/status

# View active sessions
curl http://localhost:4444/grid/api/sessions
```

#### 2. Enable Detailed Logging

```javascript
module.exports = {
    plugins: [
        ['@ringai/plugin-playwright-driver', {
            seleniumGrid: {
                gridCapabilities: {
                    'se:options': {
                        'logLevel': 'DEBUG'
                    }
                }
            }
        }]
    ]
};
```

#### 3. View Browser Console

In Grid UI (http://localhost:4444), you can see:
- Active sessions
- Node status
- Test execution videos

## 🔗 Related Resources

- [Playwright Selenium Grid Documentation](https://playwright.dev/docs/selenium-grid)
- [Selenium Grid 4 Documentation](https://selenium-grid.github.io/selenium-grid/)
- [Docker Selenium Images](https://github.com/SeleniumHQ/docker-selenium)
- [Selenium Grid UI](https://github.com/SeleniumHQ/selenium/wiki/Grid2)

## 💡 Tips

1. **Performance Optimization**: Use `headless` mode to improve performance
2. **Resource Limits**: Set appropriate concurrency to avoid resource exhaustion
3. **Network Stability**: Increase retry count in unstable network environments
4. **Monitoring**: Regularly monitor Grid node health
5. **Cleanup**: Clean up stale sessions and log files promptly
