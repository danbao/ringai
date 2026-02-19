import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const crxFilePath = path.join(__dirname, './extension.crx');

let CACHED_CRX_BASE64: string | null = null;

function getCrxBase64() {
    if (CACHED_CRX_BASE64) {
        return CACHED_CRX_BASE64;
    }

    const crxData = fs.readFileSync(crxFilePath);
    CACHED_CRX_BASE64 = crxData.toString('base64');

    return CACHED_CRX_BASE64;
}

export const getCrxBase64Export = getCrxBase64;

export default {
    getCrxBase64,
};
