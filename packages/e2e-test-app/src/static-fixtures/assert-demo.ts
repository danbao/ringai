import { Context } from 'hono';

export function getAssertDemoHtml(c: Context) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Assert Demo</title>
</head>
<body data-test-automation-id="root">
    <div data-test-automation-id="container">
        <h1 data-test-automation-id="heading">Assert Demo Page</h1>
        <p data-test-automation-id="paragraph">Hello World</p>
        <span data-test-automation-id="numberSpan">42</span>
        <span data-test-automation-id="emptySpan"></span>
        <input type="text" data-test-automation-id="textInput" value="test-value">
        <ul data-test-automation-id="list">
            <li data-test-automation-id="item">Item 1</li>
            <li data-test-automation-id="item">Item 2</li>
            <li data-test-automation-id="item">Item 3</li>
        </ul>
        <div data-test-automation-id="hidden" style="display:none">hidden content</div>
        <a href="#" data-test-automation-id="link" data-custom="custom-attr">Link</a>
    </div>
</body>
</html>`;
    return c.html(html);
}
