# @ringai/download-collector-crx

Chrome extension for the ringai framework that enables monitoring and tracking of file downloads during automated testing. This extension solves the problem of accessing download information in headless browser mode by storing download metadata in localStorage, making it accessible to test scripts.

## Overview

The download collector Chrome extension addresses a critical limitation in browser automation testing: accessing download information in headless mode. Since accessing Chrome's internal pages like `chrome://downloads` is restricted in headless mode, this extension provides an alternative way to track and verify downloads by:

- **Monitoring download events** through Chrome's downloads API
- **Tracking download progress and status** across the entire download lifecycle
- **Storing download metadata** in localStorage for easy access from test scripts
- **Providing a consistent API** for download verification in both headless and normal browser modes

## Key Features

### 🔍 Download Tracking
- Complete download lifecycle monitoring (created, started, in progress, completed)
- Detailed metadata collection for each download
- Real-time status updates for download progress
- Persistent storage of download history

### 💾 Download Information Storage
- Automatic storage of download metadata in localStorage
- Sorted download history by timestamp
- Accessible from any page in the browser
- Persistent across page navigations

### 🧪 Testing Framework Support
- Easy integration with Playwright and other browser automation tools
- Simple API for accessing download information
- Verification helpers for download status checking
- Support for both headless and normal browser modes

## Installation

```bash
pnpm add @ringai/download-collector-crx --save-dev
```

The extension is automatically built during installation via a postinstall script.

## Usage

### Basic Usage

The extension stores download information in localStorage, making it accessible from any page:

```typescript
// In your test script, access download information
const downloadsJSONStr = await page.evaluate(() => {
    return localStorage.getItem('_DOWNLOADS_');
});

// Parse the JSON string to get download objects
// Downloads are sorted in descending order by startTime (newest first)
const downloads = JSON.parse(downloadsJSONStr);

// Verify a specific download
const latestDownload = downloads[0];
expect(latestDownload.fileName).toBe('expected-file.pdf');
expect(latestDownload.state).toBe('complete');
```

### Download Object Structure

Each download item contains the following properties:

```typescript
interface DownloadItem {
    id: number;            // Chrome download ID
    fileName: string;      // File name
    filePath?: string;     // Full file path (when available)
    fileUrl?: string;      // Source URL (when available)
    state: string;         // Download state: 'in_progress', 'complete', 'interrupted'
    startTime: number;     // Download start timestamp (milliseconds)
}
```

### Integration with Playwright

```typescript
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { getCrxBase64 } from '@ringai/download-collector-crx';

async function runTest() {
    // Create a temporary CRX file
    const crxPath = path.join(import.meta.dirname, 'temp-extension.crx');
    fs.writeFileSync(crxPath, Buffer.from(getCrxBase64(), 'base64'));

    // Launch browser with extension
    const context = await chromium.launchPersistentContext('', {
        args: [
            `--disable-extensions-except=${crxPath}`,
            `--load-extension=${crxPath}`,
        ],
    });

    const page = await context.newPage();

    try {
        // Navigate to download page
        await page.goto('https://example.com/download-page');

        // Click download button
        await page.click('#download-button');

        // Wait for download to complete
        await page.waitForTimeout(2000);

        // Get download information
        const downloadsStr = await page.evaluate(() => {
            return localStorage.getItem('_DOWNLOADS_');
        });

        const downloads = JSON.parse(downloadsStr!);
        console.log('Downloads:', downloads);

        // Verify download
        const latestDownload = downloads[0];
        expect(latestDownload.state).toBe('complete');
        expect(latestDownload.fileName).toBe('expected-file.pdf');
    } finally {
        await context.close();
        // Clean up temporary file
        fs.unlinkSync(crxPath);
    }
}
```

## Extension Architecture

### Components

#### Background Script (Service Worker)

The background script monitors download events and broadcasts them to all tabs:

```javascript
// Listens for download creation events
chrome.downloads.onCreated.addListener((downloadItem) => {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'downloadStarted',
                downloadItem,
            });
        });
    });
});

// Listens for download state changes
chrome.downloads.onChanged.addListener((downloadItem) => {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'downloadChanged',
                downloadItem,
            });
        });
    });
});
```

#### Content Script

The content script receives download events and updates localStorage:

```javascript
const DOWNLOAD_KEY = '_DOWNLOADS_';
const DOWNLOADS = {};

chrome.runtime.onMessage.addListener((message) => {
    const { action, downloadItem } = message;

    if (action === 'downloadStarted') {
        DOWNLOADS[downloadItem.id] = {
            id: downloadItem.id,
            fileName: '',
            fileUrl: '',
            state: downloadItem.state,
            startTime: new Date(downloadItem.startTime).getTime(),
        };
        updatePageVariable();
    }

    if (action === 'downloadChanged') {
        const download = DOWNLOADS[downloadItem.id];
        if (download) {
            if (downloadItem.state?.current) {
                download.state = downloadItem.state.current;
            }
            updatePageVariable();
        }
    }
});

function updatePageVariable() {
    const downloads = Object.values(DOWNLOADS);
    downloads.sort((a, b) => b.startTime - a.startTime);
    localStorage.setItem('_DOWNLOADS_', JSON.stringify(downloads));
}
```

## API Reference

### Module Exports

```typescript
// Returns the extension's CRX file as a base64-encoded string
export function getCrxBase64(): string;
```

The `getCrxBase64()` function returns the extension's CRX file as a base64-encoded string, which can be used to load the extension programmatically in browser automation tools.

## Troubleshooting

### Common Issues

1. **Extension not loading**:
   - Verify the CRX file was properly generated during installation (`pnpm install`)
   - Check browser console for extension errors
   - Ensure proper permissions are granted to the extension

2. **Downloads not appearing in localStorage**:
   - Verify the extension is properly loaded
   - Check that the download was initiated after the extension was loaded
   - Ensure the page has access to localStorage (not in incognito mode)

3. **Headless mode issues**:
   - Ensure you're using the correct Chrome flags for loading extensions in headless mode
   - Some Chrome versions have limitations with extensions in headless mode

### Debug Tips

```typescript
// Check if extension is working
const extensionWorking = await page.evaluate(() => {
    return typeof localStorage.getItem('_DOWNLOADS_') === 'string';
});
console.log('Extension working:', extensionWorking);

// Log all localStorage keys
const allKeys = await page.evaluate(() => {
    return Object.keys(localStorage);
});
console.log('All localStorage keys:', allKeys);
```

## Dependencies

- **`crx`** — Chrome extension packaging tool
- **`shx`** — Cross-platform shell commands for Node.js

## Related Modules

- **[@ringai/plugin-playwright-driver](../packages/plugin-playwright-driver.md)** — Playwright integration
- **[@ringai/web-application](web-application.md)** — Web application testing utilities

## Requirements

- **Node.js:** 22+
- **pnpm:** 10+

## License

MIT License — see the [LICENSE](https://github.com/ringcentral/ringai/blob/master/LICENSE) file for details.
