// Global test setup
// Set process listener limit before all tests to avoid MaxListenersExceededWarning

// Set a sufficiently large listener limit to avoid warnings
// Playwright and the test framework register multiple process listeners
// Larger test suites may require a higher limit
process.setMaxListeners(200);

// Optional: enable the following code to debug listener issues
// const originalAddListener = process.addListener;
// process.addListener = function(event: string, listener: (...args: any[]) => void) {
//     console.log(`Adding listener for event: ${event}, current count: ${process.listenerCount(event)}`);
//     return originalAddListener.call(this, event, listener);
// };

console.log('Test setup: Set process max listeners to 200');
