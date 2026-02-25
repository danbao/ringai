export interface IDevtoolRuntimeConfiguration {
    host: string;
    httpPort: number;
    wsPort: number;
    extensionId: string;
}

export const enum ExtensionPostMessageTypes {
    CLEAR_HIGHLIGHTS = 'ExtensionPostMessageTypes/CLEAR_HIGHLIGHTS',
    ADD_XPATH_HIGHLIGHT = 'ExtensionPostMessageTypes/ADD_XPATH_HIGHLIGHT',
    REMOVE_XPATH_HIGHLIGHT = 'ExtensionPostMessageTypes/REMOVE_XPATH_HIGHLIGHT',
}
