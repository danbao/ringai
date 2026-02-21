import { Context } from 'hono';

export function getSimulateFieldHtml(c: Context) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Simulate Field</title>
</head>
<body data-test-automation-id="root">
    <div data-test-automation-id="container">
        <input type="text" id="jsField" data-test-automation-id="jsField" value="initial-value">
        <span data-test-automation-id="changeLog" id="changeLog"></span>
        <span data-test-automation-id="inputLog" id="inputLog"></span>
    </div>
    <script>
        var changeCount = 0;
        var inputCount = 0;
        var field = document.getElementById('jsField');
        field.addEventListener('change', function() {
            changeCount++;
            document.getElementById('changeLog').textContent = 'change:' + changeCount + ':' + field.value;
        });
        field.addEventListener('input', function() {
            inputCount++;
            document.getElementById('inputLog').textContent = 'input:' + inputCount + ':' + field.value;
        });
    </script>
</body>
</html>`;
    return c.html(html);
}
