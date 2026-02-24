/**
 * Tinypool worker script for test execution
 * 
 * This runs in a worker_threads context and handles test execution
 */

import { parentPort } from 'worker_threads';
import { transport } from '@ringai/transport';
import { testAPIController } from '@ringai/api';
import { WorkerController } from './worker/worker-controller';
import { loggerClient } from '@ringai/logger';

const logger = loggerClient.withPrefix('[worker-tinypool]');

// Initialize the worker controller
const controller = new WorkerController(transport, testAPIController);

// Listen for messages from the main thread
parentPort?.on('message', async (message) => {
    try {
        logger.debug(`Received message in Tinypool worker: ${message.type}`);
        
        if (message.type === 'executeTest') {
            // Execute the test
            const result = await controller.executeTest(message.payload);
            
            // Send result back to main thread
            parentPort?.postMessage({
                success: true,
                result,
            });
        }
    } catch (error) {
        logger.error('Error in Tinypool worker:', error);
        
        parentPort?.postMessage({
            success: false,
            error: error instanceof Error ? error.message : String(error),
        });
    }
});

// Notify that worker is ready
parentPort?.postMessage({ ready: true });
