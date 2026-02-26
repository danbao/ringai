import { Context } from 'hono';

export function getResponsiveHtml(c: Context) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Responsive test</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .desktop-only { display: block; }
        .mobile-only { display: none; }
        .tablet-banner { display: none; }

        .nav-links { display: flex; gap: 16px; }
        .hamburger-menu { display: none; }

        .grid-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            padding: 16px;
        }

        .heading {
            font-size: clamp(16px, 4vw, 48px);
            padding: 16px;
        }

        @media (max-width: 1024px) {
            .grid-container {
                grid-template-columns: 1fr;
            }
            .tablet-banner {
                display: block;
            }
        }

        @media (max-width: 767px) {
            .desktop-only { display: none; }
            .mobile-only { display: block; }
            .nav-links { display: none; }
            .hamburger-menu { display: block; }
        }
    </style>
    <script>
        function updateViewportInfo() {
            var el = document.getElementById('viewportInfo');
            if (el) {
                el.innerText = window.innerWidth + 'x' + window.innerHeight;
            }
        }

        function updateResizeCount() {
            var el = document.getElementById('resizeCount');
            if (el) {
                var count = parseInt(el.innerText || '0', 10);
                el.innerText = String(count + 1);
            }
        }

        window.addEventListener('resize', function () {
            updateViewportInfo();
            updateResizeCount();
        });

        window.addEventListener('DOMContentLoaded', function () {
            updateViewportInfo();
        });
    </script>
</head>
<body data-test-automation-id="root">
    <nav>
        <div class="nav-links" data-test-automation-id="navLinks">
            <a href="#">Home</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
        </div>
        <div class="hamburger-menu" data-test-automation-id="hamburgerMenu">Menu</div>
    </nav>

    <h1 class="heading" data-test-automation-id="heading">Responsive Page</h1>

    <div class="desktop-only" data-test-automation-id="desktopOnly">Desktop Content</div>
    <div class="mobile-only" data-test-automation-id="mobileOnly">Mobile Content</div>
    <div class="tablet-banner" data-test-automation-id="tabletBanner">Tablet Banner</div>

    <div class="grid-container" data-test-automation-id="gridContainer">
        <div class="grid-item" data-test-automation-id="gridItem1">Item 1</div>
        <div class="grid-item" data-test-automation-id="gridItem2">Item 2</div>
    </div>

    <p>Viewport: <span id="viewportInfo" data-test-automation-id="viewportInfo"></span></p>
    <p>Resize count: <span id="resizeCount" data-test-automation-id="resizeCount">0</span></p>
</body>
</html>
`;
    return c.html(html);
}
