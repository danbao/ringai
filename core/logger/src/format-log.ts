import {ILogEntity, LogLevel, LogTypes} from '@ringai/types';

const PREFIX_MODULE_MAP: Record<string, string> = {
    '[web-application]': 'web-app',
    '[worker-controller]': 'worker',
    '[browser-proxy]': 'browser',
    '[test-run-controller]': 'test-ctl',
    '[fs-store]': 'fs-store',
    '[fs-reader]': 'fs-read',
    '[plugin-api]': 'plugin',
    '[devtool]': 'devtool',
};

function extractModule(prefix: string | null | undefined): string {
    if (!prefix) return '-';
    for (const [key, value] of Object.entries(PREFIX_MODULE_MAP)) {
        if (prefix.includes(key)) return value;
    }
    const match = prefix.match(/^\[(.+?)\]/);
    if (match?.[1]) {
        return match[1].length > 8 ? match[1].slice(0, 8) : match[1];
    }
    return '-';
}

function extractAction(logEntity: ILogEntity): string {
    const content = logEntity.content;
    if (logEntity.type === LogTypes.screenshot) return 'screenshot';
    if (logEntity.type === LogTypes.step) {
        const msg = typeof content[0] === 'string' ? content[0] : '';
        if (msg.startsWith('[assert]') || msg.startsWith('[softAssert]')) return 'assert';
        if (msg.startsWith('[step end]')) return 'step-end';
        return 'step';
    }
    return 'log';
}

function extractContent(logEntity: ILogEntity): string {
    const content = logEntity.content;
    if (logEntity.type === LogTypes.screenshot) {
        return `Filename: ${content[0]}`;
    }
    const parts = content.map((c: any) => {
        if (typeof c === 'string') return c;
        try { return JSON.stringify(c); }
        catch { return String(c); }
    });
    return parts.join(' ');
}

function formatISOTime(time: Date | string): string {
    const d = time instanceof Date ? time : new Date(time);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 23);
    return d.toISOString().slice(0, 23);
}

function formatLevel(level: LogLevel): string {
    switch (level) {
        case LogLevel.info: return 'INFO ';
        case LogLevel.debug: return 'DEBUG';
        case LogLevel.warning: return 'WARN ';
        case LogLevel.error: return 'ERROR';
        case LogLevel.verbose: return 'VERB ';
        case LogLevel.silent: return 'SILENT';
        default: return String(level).toUpperCase().padEnd(5);
    }
}

function formatProcessID(processID?: string): string {
    if (!processID) return 'main  ';
    if (processID === 'main') return 'main  ';
    const slashIdx = processID.indexOf('/');
    if (slashIdx >= 0) {
        const id = processID.slice(slashIdx + 1, slashIdx + 7);
        return `wkr/${id}`;
    }
    return processID.length > 6 ? processID.slice(0, 6) : processID.padEnd(6);
}

export function formatLog(
    logEntity: ILogEntity,
    processID?: string,
): string {
    const ts = formatISOTime(logEntity.time);
    const level = formatLevel(logEntity.logLevel);
    const pid = formatProcessID(processID);
    const mod = extractModule(logEntity.prefix).padEnd(8);
    const action = extractAction(logEntity).padEnd(10);
    const msg = extractContent(logEntity);

    return `${ts} | ${level} | ${pid} | ${mod} | ${action} | ${msg}`;
}

export function formatLogJsonl(
    logEntity: ILogEntity,
    processID?: string,
): string {
    const entry: Record<string, any> = {
        ts: formatISOTime(logEntity.time),
        level: logEntity.logLevel,
        pid: processID || 'main',
        module: extractModule(logEntity.prefix),
        action: extractAction(logEntity),
        msg: extractContent(logEntity),
    };

    if (logEntity.type === LogTypes.step) {
        const msg = typeof logEntity.content[0] === 'string' ? logEntity.content[0] : '';
        const assertMatch = msg.match(/^\[(assert|softAssert)\]\s+(\w+)\((.+)\)$/);
        if (assertMatch) {
            entry['assertType'] = assertMatch[1];
            entry['method'] = assertMatch[2];
            try { entry['args'] = JSON.parse(`[${assertMatch[3]}]`); } catch { /* keep msg */ }
        }
    }

    return JSON.stringify(entry);
}
