export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'API' | 'AUTH' | 'WALLET' | 'UI' | 'APP';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: LogCategory;
    message: string;
    data?: unknown;
}

export type RemoteLogHandler = (entry: LogEntry) => void;

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
    debug: 'DEBUG',
    info: 'INFO ',
    warn: 'WARN ',
    error: 'ERROR',
};

let remoteHandler: RemoteLogHandler | null = null;

function getMinLevel(): LogLevel {
    return __DEV__ ? 'debug' : 'warn';
}

function shouldLog(level: LogLevel): boolean {
    const minLevel = getMinLevel();
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
}

function formatTime(date: Date): string {
    return date.toTimeString().slice(0, 8);
}

function formatData(data: unknown): string {
    if (data === undefined) return '';
    try {
        return JSON.stringify(data, null, 0);
    } catch {
        return String(data);
    }
}

function log(level: LogLevel, category: LogCategory, message: string, data?: unknown): void {
    if (!shouldLog(level)) return;

    const now = new Date();
    const entry: LogEntry = {
        timestamp: now.toISOString(),
        level,
        category,
        message,
        data,
    };

    // Format: [14:30:00] DEBUG [API] Message { data }
    const time = formatTime(now);
    const levelLabel = LOG_LEVEL_LABELS[level];
    const dataStr = data !== undefined ? ` ${formatData(data)}` : '';
    const formattedMessage = `[${time}] ${levelLabel} [${category}] ${message}${dataStr}`;

    // Console output
    switch (level) {
        case 'debug':
            // eslint-disable-next-line no-console
            console.debug(formattedMessage);
            break;
        case 'info':
            // eslint-disable-next-line no-console
            console.info(formattedMessage);
            break;
        case 'warn':
            // eslint-disable-next-line no-console
            console.warn(formattedMessage);
            break;
        case 'error':
            // eslint-disable-next-line no-console
            console.error(formattedMessage);
            break;
    }

    // Remote handler (for Sentry, LogRocket, etc.)
    if (remoteHandler) {
        try {
            remoteHandler(entry);
        } catch {
            // Silently ignore remote handler errors
        }
    }
}

export const logger = {
    debug: (category: LogCategory, message: string, data?: unknown) => log('debug', category, message, data),
    info: (category: LogCategory, message: string, data?: unknown) => log('info', category, message, data),
    warn: (category: LogCategory, message: string, data?: unknown) => log('warn', category, message, data),
    error: (category: LogCategory, message: string, data?: unknown) => log('error', category, message, data),

    setRemoteHandler: (handler: RemoteLogHandler | null) => {
        remoteHandler = handler;
    },
};

export default logger;
