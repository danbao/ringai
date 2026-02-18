
import * as path from 'path';
import * as chai from 'chai';
import {fork} from '../src/fork';

const fixtures = path.resolve(__dirname, './fixtures');

describe('fork', () => {
    it('should fork .js files with node', () => new Promise<void>((resolve, reject) => {
        fork(path.join(fixtures, 'javascript.js')).then((ps) => {
            ps.on('exit', (_, signal) => {
                if (signal) {
                    reject(signal);
                } else {
                    chai.expect(ps['spawnfile'].endsWith('node')).to.equal(
                        true,
                    );

                    resolve();
                }
            });
        });
    }));
});
