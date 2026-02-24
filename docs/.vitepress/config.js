import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Ringai Documentation',
  description: 'A modern Node.js-based automated UI testing framework for web applications',
  // Only use GitHub Pages base when explicitly set for production
  base: process.env.VITEPRESS_PRODUCTION === 'true' ? '/ringai/' : '/',
  
  // Clean URLs - allows accessing /guides/ instead of /guides/README.html
  cleanUrls: true,
  
  // Ignore localhost links and development URLs
  ignoreDeadLinks: [
    // Local development links
    /^http:\/\/localhost:/,
    // External service links that may not be accessible during build
    /^https?:\/\/(?:www\.)?(?:selenium\.dev|docs\.seleniumhq\.org)/
  ],
  
  // Theme config
  themeConfig: {
    // Logo
    logo: '/logo.svg',
    
    // Navigation
    nav: [
      { text: 'Getting Started', link: '/getting-started/' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Core Modules', link: '/core-modules/' },
      { text: 'Packages', link: '/packages/' },
      { text: 'Guides', link: '/guides/' },
      { text: 'Test Fixtures', link: 'https://testring-dev.ringcentral.workers.dev/', target: '_blank' },
      { text: 'GitHub', link: 'https://github.com/ringcentral/ringai', target: '_blank' }
    ],

    // Sidebar
    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/getting-started/' },
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'Quick Start', link: '/getting-started/quick-start' },
            { text: 'Migration Guides', link: '/getting-started/migration-guides/' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' }
          ]
        }
      ],
      '/guides/': [
        {
          text: 'Guides',
          items: [
            { text: 'Overview', link: '/guides/' },
            { text: 'Contributing', link: '/guides/contributing' },
            { text: 'Plugin Development', link: '/guides/plugin-development' },
            { text: 'Testing Best Practices', link: '/guides/testing-best-practices' },
            { text: 'Troubleshooting', link: '/guides/troubleshooting' }
          ]
        }
      ],
      '/core-modules/': [
        {
          text: 'Core Modules',
          items: [
            { text: 'Overview', link: '/core-modules/' },
            { text: 'API', link: '/core-modules/api' },
            { text: 'CLI', link: '/core-modules/cli' },
            { text: 'CLI Config', link: '/core-modules/cli-config' },
            { text: 'Types', link: '/core-modules/types' },
            { text: 'Utils', link: '/core-modules/utils' },
            { text: 'Logger', link: '/core-modules/logger' },
            { text: 'Transport', link: '/core-modules/transport' },
            { text: 'Child Process', link: '/core-modules/child-process' },
            { text: 'FS Reader', link: '/core-modules/fs-reader' },
            { text: 'FS Store', link: '/core-modules/fs-store' },
            { text: 'Sandbox', link: '/core-modules/sandbox' },
            { text: 'Test Worker', link: '/core-modules/test-worker' },
            { text: 'Test Run Controller', link: '/core-modules/test-run-controller' },
            { text: 'Plugin API', link: '/core-modules/plugin-api' },
            { text: 'Pluggable Module', link: '/core-modules/pluggable-module' },
            { text: 'Dependencies Builder', link: '/core-modules/dependencies-builder' },
            { text: 'Async Assert', link: '/core-modules/async-assert' },
            { text: 'Async Breakpoints', link: '/core-modules/async-breakpoints' },
            { text: 'Ringai', link: '/core-modules/ringai' }
          ]
        }
      ],
      '/packages/': [
        {
          text: 'Packages',
          items: [
            { text: 'Overview', link: '/packages/' },
            { text: 'Browser Proxy', link: '/packages/browser-proxy' },
            { text: 'Client WS Transport', link: '/packages/client-ws-transport' },
            { text: 'DevTool Backend', link: '/packages/devtool-backend' },
            { text: 'DevTool Extension', link: '/packages/devtool-extension' },
            { text: 'DevTool Frontend', link: '/packages/devtool-frontend' },
            { text: 'Element Path', link: '/packages/element-path' },
            { text: 'HTTP API', link: '/packages/http-api' },
            { text: 'Plugin Babel', link: '/packages/plugin-babel' },
            { text: 'Plugin FS Store', link: '/packages/plugin-fs-store' },
            { text: 'Plugin Playwright Driver', link: '/packages/plugin-playwright-driver' },
            { text: 'Plugin Selenium Driver', link: '/packages/plugin-selenium-driver' },
            { text: 'Test Utils', link: '/packages/test-utils' },
            { text: 'Web Application', link: '/packages/web-application' },
            { text: 'E2E Test App', link: '/packages/e2e-test-app' },
            { text: 'Download Collector CRX', link: '/packages/download-collector-crx' }
          ]
        }
      ],
      '/playwright-driver/': [
        {
          text: 'Playwright Driver',
          items: [
            { text: 'Overview', link: '/playwright-driver/' },
            { text: 'Installation', link: '/playwright-driver/installation' },
            { text: 'Migration', link: '/playwright-driver/migration' },
            { text: 'Debug', link: '/playwright-driver/debug' },
            { text: 'Selenium Grid Guide', link: '/playwright-driver/selenium-grid-guide' }
          ]
        }
      ],
      '/configuration/': [
        {
          text: 'Configuration',
          items: [
            { text: 'Overview', link: '/configuration/' }
          ]
        }
      ]
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ringcentral/ringai' }
    ],

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 RingCentral'
    },

    // Search
    search: {
      provider: 'local'
    },

    // Edit link
    editLink: {
      pattern: 'https://github.com/ringcentral/ringai/edit/master/docs/:path',
      text: 'Edit this page on GitHub'
    },

    // Last updated
    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    }
  },

  // Markdown config
  markdown: {
    lineNumbers: true,
    config: (md) => {
      // Custom markdown configuration if needed
    }
  },

  // Build options
  buildConcurrency: 5,

  // Vite config for handling static assets
  vite: {
    assetsInclude: ['**/*.html']
  }
}) 