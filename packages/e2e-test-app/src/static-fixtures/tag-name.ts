import { Context } from 'hono';

export function getTagNameHtml(c: Context) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tag Name and Execute</title>
</head>
<body data-test-automation-id="root">
    <div data-test-automation-id="divElement">A div</div>
    <input type="text" data-test-automation-id="inputElement" value="hello">
    <button data-test-automation-id="buttonElement" id="execBtn">Click me</button>
    <span data-test-automation-id="resultSpan" id="resultSpan"></span>
    <input type="text" data-test-automation-id="keyTarget" id="keyTarget">
    <span data-test-automation-id="keyLog" id="keyLog"></span>
    <script>
        document.getElementById('keyTarget').addEventListener('keydown', function(e) {
            document.getElementById('keyLog').textContent = 'key:' + e.key;
        });
    </script>
</body>
</html>`;
    return c.html(html);
}
