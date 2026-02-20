# Testing Best Practices

This guide outlines best practices for writing effective tests with testring.

## Test Organization

### File Structure

Organize your tests in a logical directory structure:

```
test/
├── unit/                 # Unit tests
├── integration/          # Integration tests
├── e2e/                 # End-to-end tests
├── fixtures/            # Test data and fixtures
├── helpers/             # Test helper functions
└── config/              # Test configurations
```

### Naming Conventions

Use descriptive and consistent naming:

```typescript
// Good: Descriptive test names
describe('User Authentication', () => {
    it('should login with valid credentials', async () => {
        // Test implementation
    });

    it('should show error message for invalid credentials', async () => {
        // Test implementation
    });
});

// Bad: Vague test names
describe('Login', () => {
    it('works', async () => {
        // Test implementation
    });
});
```

## Writing Effective Tests

### Test Independence

Each test should be independent and not rely on other tests:

```typescript
import { describe, it, beforeEach, expect } from 'vitest';

describe('Shopping Cart', () => {
    beforeEach(async () => {
        await page.goto('/cart');
        await clearCart();
    });

    it('should add item to cart', async () => {
        await addItemToCart('product-1');
        const count = await getCartItemCount();
        expect(count).toBe(1);
    });

    it('should remove item from cart', async () => {
        await addItemToCart('product-1');
        await removeItemFromCart('product-1');
        const count = await getCartItemCount();
        expect(count).toBe(0);
    });
});
```

### Use Page Object Model

Organize your UI interactions using the Page Object Model:

```typescript
// pages/LoginPage.ts
import type { Page } from 'playwright';

export class LoginPage {
    constructor(private page: Page) {}

    get usernameInput() { return this.page.locator('#username'); }
    get passwordInput() { return this.page.locator('#password'); }
    get loginButton() { return this.page.locator('#login-btn'); }
    get errorMessage() { return this.page.locator('.error-message'); }

    async login(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async getErrorMessage(): Promise<string> {
        await this.errorMessage.waitFor({ state: 'visible' });
        return await this.errorMessage.textContent() ?? '';
    }
}

// test/login.spec.ts
import { describe, it, expect } from 'vitest';
import { LoginPage } from '../pages/LoginPage.js';

describe('Login Functionality', () => {
    it('should login successfully', async () => {
        await page.goto('/login');
        const loginPage = new LoginPage(page);
        await loginPage.login('user@example.com', 'password123');

        await page.waitForURL('**/dashboard', { timeout: 5000 });
        expect(page.url()).toContain('/dashboard');
    });
});
```

### Reliable Element Selection

Use stable selectors that won't break easily:

```typescript
// Good: Use data attributes
const submitButton = page.locator('[data-test-id="submit-button"]');

// Good: Use semantic selectors
const heading = page.locator('h1');

// Good: Use role-based selectors (Playwright best practice)
const button = page.getByRole('button', { name: 'Submit' });
const input = page.getByLabel('Email');
const link = page.getByRole('link', { name: 'Sign up' });

// Acceptable: Use specific CSS selectors
const navItem = page.locator('nav .menu-item:first-child');

// Bad: Fragile selectors
const element = page.locator('div > div:nth-child(3) > span');
```

### Proper Waiting Strategies

Playwright has built-in auto-waiting, but you can add explicit waits when needed:

```typescript
// Good: Playwright auto-waits for elements before actions
const element = page.locator('#my-element');
await element.click(); // Auto-waits for element to be actionable

// Good: Wait for specific conditions
await expect(page.locator('.list-item')).toHaveCount(5, { timeout: 10000 });

// Good: Wait for navigation
await page.waitForURL('**/dashboard');

// Good: Wait for network idle
await page.waitForLoadState('networkidle');

// Good: Wait for a response
await page.waitForResponse(resp =>
    resp.url().includes('/api/data') && resp.status() === 200
);
```

## Test Data Management

### Use Fixtures

Store test data in separate files:

```json
// fixtures/users.json
{
    "validUser": {
        "email": "test@example.com",
        "password": "password123"
    },
    "invalidUser": {
        "email": "invalid@example.com",
        "password": "wrongpassword"
    }
}
```

```typescript
// test/login.spec.ts
import { describe, it } from 'vitest';
import users from '../fixtures/users.json' with { type: 'json' };

describe('Login Tests', () => {
    it('should login with valid user', async () => {
        const loginPage = new LoginPage(page);
        await loginPage.login(users.validUser.email, users.validUser.password);
        // Assert success
    });
});
```

### Dynamic Test Data

Generate dynamic data to avoid conflicts:

```typescript
import { faker } from '@faker-js/faker';
import { describe, it } from 'vitest';

describe('User Registration', () => {
    it('should register new user', async () => {
        const userData = {
            email: faker.internet.email(),
            password: faker.internet.password(),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
        };

        await RegistrationPage.register(userData);
        // Assert registration success
    });
});
```

## Error Handling and Debugging

### Comprehensive Error Messages

Provide clear error messages:

```typescript
import { expect } from 'vitest';

// Good: Descriptive assertions with Vitest
const actualTitle = await page.title();
expect(actualTitle, `Expected page title to be 'Expected Page Title' but got '${actualTitle}'`)
    .toBe('Expected Page Title');

// Good: Playwright assertions with built-in messages
await expect(page).toHaveURL(/\/success/, { timeout: 5000 });
await expect(page.locator('.status')).toHaveText('Complete');
```

### Screenshots on Failure

Capture screenshots when tests fail:

```typescript
import { afterEach } from 'vitest';

afterEach(async (context) => {
    if (context.task.result?.state === 'fail') {
        const testName = context.task.name.replace(/\s+/g, '_');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${testName}_${timestamp}.png`;

        await page.screenshot({ path: `./screenshots/${filename}` });
        console.log(`Screenshot saved: ${filename}`);
    }
});
```

## Performance Optimization

### Parallel Execution

Configure appropriate parallelization in `.testringrc`:

```json
{
    "workerLimit": 4,
    "retryCount": 1,
    "timeout": 30000
}
```

### Efficient Test Structure

Group related tests and use setup/teardown efficiently:

```typescript
import { describe, it, beforeAll, beforeEach, afterAll } from 'vitest';

describe('E-commerce Workflow', () => {
    beforeAll(async () => {
        // One-time setup for all tests
        await setupTestDatabase();
    });

    beforeEach(async () => {
        // Setup for each test
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
    });

    afterAll(async () => {
        // One-time cleanup
        await cleanupTestDatabase();
    });

    // Group related tests
    describe('Product Search', () => {
        it('should find products by name', async () => {
            // Test implementation
        });

        it('should filter products by category', async () => {
            // Test implementation
        });
    });
});
```

## Continuous Integration

### CI-Friendly Configuration

Configure tests for CI environments in `.testringrc`:

```json
{
    "plugins": [
        ["@testring/plugin-playwright-driver", {
            "headless": true
        }]
    ],
    "retryCount": 2,
    "timeout": 60000
}
```

### Environment-Specific Configs

Use different configurations for different environments:

```typescript
// .testringrc.js
const baseConfig = {
    tests: './test/**/*.spec.ts',
};

const environments = {
    local: {
        ...baseConfig,
        plugins: [
            ['@testring/plugin-playwright-driver', { headless: false }],
        ],
    },
    ci: {
        ...baseConfig,
        plugins: [
            ['@testring/plugin-playwright-driver', { headless: true }],
        ],
        retryCount: 2,
    },
};

export default environments[process.env.NODE_ENV] || environments.local;
```

## Code Quality

### Linting and Formatting

Use ESLint flat config for consistent code style:

```javascript
// eslint.config.js
import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                browser: 'readonly',
            },
        },
    },
];
```

### Code Reviews

Establish code review practices:

1. Review test logic and assertions
2. Check for proper error handling
3. Verify test independence
4. Ensure good naming conventions
5. Validate test data management

## Documentation

### Test Documentation

Document complex test scenarios:

```typescript
/**
 * Test the complete user registration workflow
 *
 * This test covers:
 * 1. Form validation
 * 2. Email verification
 * 3. Account activation
 * 4. First login
 *
 * Prerequisites:
 * - Email service must be running
 * - Database must be clean
 */
describe('User Registration Workflow', () => {
    // Test implementation
});
```

### Maintain Test Inventory

Keep track of test coverage and scenarios in documentation.

## Summary

Following these best practices will help you:

- Write maintainable and reliable tests
- Reduce test flakiness
- Improve debugging capabilities
- Scale your test suite effectively
- Integrate smoothly with CI/CD pipelines

For more specific guidance, see:
- [API Reference](../core-modules/api.md)
- [Configuration Guide](../configuration/index.md)
- [Troubleshooting Guide](troubleshooting.md)
