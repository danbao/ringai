import {run} from 'ringai';
import {getTargetUrl} from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'simulate-field.html'));

    // Verify initial value
    const initialValue = await app.getValue(app.root.jsField);
    await app.assert.equal(initialValue, 'initial-value');

    // simulateJSFieldChange — sets value and dispatches input+change events
    await app.simulateJSFieldChange(app.root.jsField, 'new-value');
    const afterChange = await app.getValue(app.root.jsField);
    await app.assert.equal(afterChange, 'new-value');

    // Verify input event was fired
    const inputLog = await app.getText(app.root.inputLog);
    await app.assert.include(inputLog, 'input:');
    await app.assert.include(inputLog, 'new-value');

    // simulateJSFieldClear — clears value and dispatches events
    await app.simulateJSFieldClear(app.root.jsField);
    const afterClear = await app.getValue(app.root.jsField);
    await app.assert.equal(afterClear, '');

    // Verify change event was fired
    const changeLog = await app.getText(app.root.changeLog);
    await app.assert.include(changeLog, 'change:');
});
