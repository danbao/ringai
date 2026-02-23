import {fsStoreServerHooks} from '@ringai/fs-store';
import {IOnFileNameHookData, IOnFileReleaseHookData} from '@ringai/types';
import {AbstractAPI} from './abstract';

export class FSStoreServerAPI extends AbstractAPI {
    onFileNameAssign(
        handler: (
            fileName: string,
            fileMetaData: IOnFileNameHookData,
        ) => Promise<string>,
    ) {
        this.registryWritePlugin(fsStoreServerHooks.ON_FILENAME, handler);
    }

    onRelease(handler: (data: IOnFileReleaseHookData) => void) {
        this.registryReadPlugin(fsStoreServerHooks.ON_RELEASE, handler);
    }
}
