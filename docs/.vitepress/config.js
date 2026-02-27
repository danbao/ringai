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
      { text: 'GitHub', link: 'https://github.com/danbao/ringai', target: '_blank' }
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
            { text: 'Reporter', link: '/core-modules/reporter' },
            { text: 'Plugin API', link: '/core-modules/plugin-api' },
            { text: 'Pluggable Module', link: '/core-modules/pluggable-module' },
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
            { text: 'Element Path', link: '/packages/element-path' },
            { text: 'Plugin Compiler', link: '/packages/plugin-compiler' },
            { text: 'Plugin FS Store', link: '/packages/plugin-fs-store' },
            { text: 'Plugin Playwright Driver', link: '/packages/plugin-playwright-driver' },
            { text: 'Timeout Config', link: '/packages/timeout-config' },
            { text: 'Test Utils', link: '/packages/test-utils' },
            { text: 'Web Application', link: '/packages/web-application' },
            { text: 'E2E Test App', link: '/packages/e2e-test-app' }
          ]
        }
      ],
      '/playwright-driver/': [
        {
          text: 'Playwright Driver',
          items: [
            { text: 'Overview', link: '/playwright-driver/' },
            { text: 'Installation', link: '/playwright-driver/installation' },
            { text: 'Configuration', link: '/playwright-driver/configuration' },
            { text: 'Advanced Features', link: '/playwright-driver/advanced-features' },
            { text: 'Compatibility', link: '/playwright-driver/compatibility' },
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
      { icon: 'github', link: 'https://github.com/danbao/ringai' }
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
      pattern: 'https://github.com/danbao/ringai/edit/main/docs/:path',
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