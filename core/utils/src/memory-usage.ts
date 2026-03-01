const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

function formatBytes(value: number): string {
    if (value === 0) return '0B';
    const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), UNITS.length - 1);
    const size = value / Math.pow(1024, exponent);
    const unit = UNITS[exponent] ?? 'B';
    return `${size.toFixed(2)}${unit}`;
}

export function getExternalMemory(): string {
    const memoryAfter = process.memoryUsage();

    return formatBytes(memoryAfter.external);
}

export function getTotalMemoryUsed(): string {
    const memoryAfter = process.memoryUsage();

    return formatBytes(memoryAfter.rss);
}

export function getHeapTotal(): string {
    const memoryAfter = process.memoryUsage();

    return formatBytes(memoryAfter.heapTotal);
}

export function getHeapUsed(): string {
    const memoryAfter = process.memoryUsage();

    return formatBytes(memoryAfter.heapUsed);
}

export function getMemoryReport(): string {
    return `Total memory usage: ${getTotalMemoryUsed()}, External memory: ${getExternalMemory()}.`;
}

export function getHeapReport(): string {
    return `Total heap: ${getHeapTotal()}, used heap: ${getHeapUsed()}`;
}
