
import { expect } from 'chai';
import { PlaywrightPlugin } from '../src/plugin/index';

describe('PlaywrightPlugin Core Functionality', () => {
    let plugin: PlaywrightPlugin;

    afterEach(async () => {
        if (plugin) {
            try { await plugin.kill(); } catch { /* ignore */ }
        }
    });

    describe('Browser Management', () => {
        it('should create browser client for applicant', async () => {
            plugin = new PlaywrightPlugin({
                browserName: 'chromium',
                launchOptions: { headless: true },
            });
            const applicant = 'test-applicant';
            await plugin.url(applicant, 'data:text/html,<html><body>Test</body></html>');
            const title = await plugin.getTitle(applicant);
            expect(title).to.be.a('string');
        });

        it('should create separate clients for different applicants', async () => {
            plugin = new PlaywrightPlugin({
                browserName: 'chromium',
                launchOptions: { headless: true },
            });
            await plugin.url('applicant1', 'data:text/html,<html><body>Page 1</body></html>');
            await plugin.url('applicant2', 'data:text/html,<html><body>Page 2</body></html>');

            const title1 = await plugin.getTitle('applicant1');
            const title2 = await plugin.getTitle('applicant2');
            expect(title1).to.be.a('string');
            expect(title2).to.be.a('string');
        });
    });

    describe('Navigation Methods', () => {
        const applicant = 'nav-test';

        beforeEach(async () => {
            plugin = new PlaywrightPlugin({
                browserName: 'chromium',
                launchOptions: { headless: true },
            });
            await plugin.url(applicant, 'data:text/html,<html><head><title>Test Page</title></head><body><h1>Test</h1></body></html>');
        });

        it('should navigate to URL', async () => {
            const url = 'data:text/html,<html><body>Nav Test</body></html>';
            const result = await plugin.url(applicant, url);
            expect(result).to.equal(url);
        });

        it('should refresh page', async () => {
            await plugin.refresh(applicant);
        });

        it('should get page title', async () => {
            const title = await plugin.getTitle(applicant);
            expect(title).to.equal('Test Page');
        });
    });

    describe('Screenshot and Utilities', () => {
        const applicant = 'util-test';

        beforeEach(async () => {
            plugin = new PlaywrightPlugin({
                browserName: 'chromium',
                launchOptions: { headless: true },
            });
            await plugin.url(applicant, 'data:text/html,<html><body>Util Test</body></html>');
        });

        it('should take screenshot', async () => {
            const screenshot = await plugin.makeScreenshot(applicant);
            expect(screenshot).to.be.a('string');
            expect(screenshot.length).to.be.greaterThan(0);
        });

        it('should get page source', async () => {
            const source = await plugin.getSource(applicant);
            expect(source).to.include('html');
            expect(source).to.include('body');
        });

        it('should execute JavaScript', async () => {
            const result = await plugin.execute(applicant, () => 2 + 2, []);
            expect(result).to.equal(4);
        });

        it('should execute async JavaScript', async () => {
            const result = await plugin.executeAsync(applicant, () => Promise.resolve(42), []);
            expect(result).to.equal(42);
        });
    });

    describe('Session Management', () => {
        it('should end session for applicant', async () => {
            plugin = new PlaywrightPlugin({
                browserName: 'chromium',
                launchOptions: { headless: true },
            });
            const applicant = 'session-test';
            await plugin.url(applicant, 'data:text/html,<html><body>Session Test</body></html>');
            await plugin.end(applicant);
        });

        it('should handle ending non-existent session gracefully', async () => {
            plugin = new PlaywrightPlugin({
                browserName: 'chromium',
                launchOptions: { headless: true },
            });
            await plugin.end('non-existent');
        });

        it('should kill all sessions', async () => {
            plugin = new PlaywrightPlugin({
                browserName: 'chromium',
                launchOptions: { headless: true },
            });
            await plugin.url('a1', 'data:text/html,<html><body>S1</body></html>');
            await plugin.url('a2', 'data:text/html,<html><body>S2</body></html>');
            await plugin.kill();
        });
    });

    describe('Error Handling', () => {
        it('should throw error for non-existent element', async () => {
            plugin = new PlaywrightPlugin({
                browserName: 'chromium',
                launchOptions: { headless: true },
            });
            const applicant = 'error-test';
            await plugin.url(applicant, 'data:text/html,<html><body>Error Test</body></html>');
            try {
                await plugin.click(applicant, '#nonexistent');
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error instanceof Error ? error.message : String(error)).to.include('Timeout');
            }
        });

        it('should handle browser launch failure gracefully', async () => {
            const invalidPlugin = new PlaywrightPlugin({
                browserName: 'invalid' as any,
            });
            try {
                await invalidPlugin.url('test', 'data:text/html,<html><body>Error Test</body></html>');
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error instanceof Error ? error.message : String(error)).to.include('Unsupported browser');
            }
        });
    });
});
