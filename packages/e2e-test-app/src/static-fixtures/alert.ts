import { Context } from 'hono';

export function getAlertHtml(c: Context) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Alert test</title>
</head>
<body data-test-automation-id="root">
    <div data-test-automation-id="alerts">
        <p data-test-automation-id="first" class="alerts"></p>
        <p data-test-automation-id="second" class="alerts"></p>
        <p data-test-automation-id="third" class="alerts"></p>
    </div>
    <button data-test-automation-id="delayAlertButton" onclick="setTimeout(function(){ alert('delayed'); }, 1000)">Delay Alert</button>
    <script>
        const a1 = confirm();
        document.getElementsByClassName('alerts')[0].innerText = a1;

        const a2 = confirm();
        document.getElementsByClassName('alerts')[1].innerText = a2;

        const a3 = confirm('test');
        document.getElementsByClassName('alerts')[2].innerText = a3;
    </script>
</body>
</html>
`;
    return c.html(html);
}
