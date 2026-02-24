
import * as chai from 'chai';

import {TransportMock} from '@ringai/test-utils';
import {generateUniqId} from '@ringai/utils';
import {WebApplication} from '../src/web-application';

// TODO (flops) add more tests
describe('WebApplication functional', () => {
    it('should extend current instance', () => {
        const workerId = generateUniqId();
        const transport = new TransportMock();

        const webApplication = new WebApplication(workerId, transport);

        const link = webApplication.extendInstance({
            testProperty: 123,
        });

        chai.expect(link.testProperty).to.be.equal(123);
    });
});
