# Testring Documentation

This directory contains the complete documentation for Testring, built with [VitePress](https://vitepress.dev/).

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Local Development

1. **Install dependencies**:
   ```bash
   cd docs
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   The site will be available at http://localhost:5173 (VitePress default port)

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## Documentation Structure

```
docs/
├── .vitepress/           # VitePress configuration
│   ├── config.js         # Main configuration
│   └── theme/            # Custom theme
├── public/               # Static assets
├── getting-started/      # Getting started guides
├── api/                  # API reference
├── guides/               # User guides
├── core-modules/         # Core module documentation
├── packages/             # Package documentation
├── playwright-driver/    # Playwright driver docs
├── configuration/        # Configuration reference
├── troubleshooting/      # Troubleshooting guides
├── static-fixtures/      # Test fixture documentation
└── index.md             # Homepage
```

## GitHub Pages Deployment

The documentation is automatically deployed to GitHub Pages when changes are pushed to the `master` branch. The deployment is handled by the GitHub Actions workflow at `.github/workflows/docs.yml`.

### Manual Deployment

To deploy manually:

1. Build the documentation:
   ```bash
   npm run build
   ```

2. The built files will be in `.vitepress/dist/`

## Writing Documentation

### Adding New Pages

1. Create a new `.md` file in the appropriate directory
2. Add the page to the sidebar configuration in `.vitepress/config.js`
3. Use proper frontmatter if needed:
   ```yaml
   ---
   title: Page Title
   description: Page description
   ---
   ```

### Markdown Features

VitePress supports enhanced Markdown features:

- **Code blocks with syntax highlighting**
- **Custom containers** (tip, warning, danger)
- **Math expressions** with LaTeX
- **Mermaid diagrams**
- **Vue components** in Markdown

### Custom Styling

Custom styles are defined in `.vitepress/theme/custom.css`. The theme uses CSS custom properties for consistent styling.

## Features

- **Fast**: Built on Vite for lightning-fast development
- **SEO-friendly**: Automatic meta tags and sitemap generation
- **Search**: Built-in client-side search
- **Responsive**: Mobile-friendly design
- **Accessible**: WCAG compliant
- **Dark mode**: Automatic dark/light theme switching

## Contributing

When contributing to the documentation:

1. Follow the existing structure and naming conventions
2. Test locally before submitting
3. Ensure all links work correctly
4. Update the sidebar configuration if adding new sections
5. Use clear, concise language
6. Include code examples where helpful

## Troubleshooting

### Common Issues

**Build errors**: Check that all internal links are correct and all referenced files exist.

**Styling issues**: Ensure custom CSS follows VitePress conventions and doesn't conflict with the default theme.

**Navigation problems**: Verify the sidebar configuration in `.vitepress/config.js` matches your file structure.

### Getting Help

- [VitePress Documentation](https://vitepress.dev/)
- [GitHub Issues](https://github.com/ringcentral/testring/issues)
- [Community Discussions](https://github.com/ringcentral/testring/discussions)