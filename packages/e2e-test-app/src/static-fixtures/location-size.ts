import { Context } from 'hono';

export function getLocationSizeHtml(c: Context) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Location and Size</title>
    <style>
        #positioned { position: absolute; top: 50px; left: 100px; width: 200px; height: 80px; background: #ccc; }
    </style>
</head>
<body data-test-automation-id="root">
    <div id="positioned" data-test-automation-id="positioned">Positioned element</div>
    <input type="text" data-test-automation-id="focusInput" id="focusInput" autofocus>
    <button data-test-automation-id="focusButton" id="focusButton">Focus Button</button>
    <script>
        document.getElementById('focusButton').addEventListener('click', function() {
            document.getElementById('focusInput').focus();
        });
    </script>
</body>
</html>`;
    return c.html(html);
}
