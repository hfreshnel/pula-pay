import * as Sentry from '@sentry/react-native';
import type { LogEntry } from '../utils/logger';

// ── Initialisation ────────────────────────────────────────────────────────────

const SENTRY_DSN = 'https://a02e4def07b6eb93edad7caea1bc4151@o4511327091687424.ingest.de.sentry.io/4511327094505552';

export function initSentry(): void {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: __DEV__ ? 'development' : 'production',
        sendDefaultPii: true,
        enableLogs: true,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1,
        integrations: [
            Sentry.mobileReplayIntegration(),
            Sentry.feedbackIntegration(),
        ],
    });
}

// ── Logger remote handler ─────────────────────────────────────────────────────
// Compatible with logger.setRemoteHandler(). Forwards error/warn log entries
// to Sentry, giving automatic coverage of all existing logger.error() calls
// (API errors, wallet errors, etc.) without modifying every call site.

export function sentryLogHandler(entry: LogEntry): void {
    if (entry.level === 'error') {
        Sentry.withScope((scope) => {
            scope.setTag('log_category', entry.category);
            if (entry.data !== undefined) scope.setExtra('log_data', entry.data);
            Sentry.captureException(new Error(`[${entry.category}] ${entry.message}`));
        });
    } else if (entry.level === 'warn') {
        Sentry.withScope((scope) => {
            scope.setTag('log_category', entry.category);
            if (entry.data !== undefined) scope.setExtra('log_data', entry.data);
            Sentry.captureMessage(`[${entry.category}] ${entry.message}`, 'warning');
        });
    }
}

// ── User context ──────────────────────────────────────────────────────────────

export function setSentryUser(p: {
    id: string;
    email?: string;
    phoneNumber?: string;
}): void {
    Sentry.setUser({ id: p.id, email: p.email, username: p.phoneNumber });
}

export function clearSentryUser(): void {
    Sentry.setUser(null);
}

// ── Direct exception capture ──────────────────────────────────────────────────
// Use in ErrorBoundary.componentDidCatch to send the original Error object
// (preserves the real JS stack trace, unlike the logger handler which wraps
// the message in a synthetic Error).

export function captureException(
    error: unknown,
    context?: { category?: string; extra?: Record<string, unknown> }
): void {
    Sentry.withScope((scope) => {
        if (context?.category) scope.setTag('log_category', context.category);
        if (context?.extra) {
            Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
        }
        Sentry.captureException(error);
    });
}
