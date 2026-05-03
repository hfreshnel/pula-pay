import PostHog from 'posthog-react-native';

// Singleton instance — v3 pattern. `disabled: __DEV__` ensures dev runs never
// pollute production data. All methods are safe no-ops when disabled.
export const posthog = new PostHog(
    process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
    {
        host: 'https://us.i.posthog.com',
        disabled: __DEV__,
        flushAt: 20,
        flushInterval: 30,
    }
);

// ── User identity ─────────────────────────────────────────────────────────────

export function identifyUser(params: {
    id: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    kycLevel?: string | null;
    displayCurrency?: string;
    locale?: string | null;
}): void {
    posthog.identify(params.id, {
        name: params.name,
        email: params.email,
        phone_number: params.phoneNumber,
        kyc_level: params.kycLevel,
        display_currency: params.displayCurrency,
        locale: params.locale,
    });
}

export function resetTracking(): void {
    posthog.reset();
}

// ── Deposit events ────────────────────────────────────────────────────────────

export function trackDepositInitiated(p: {
    amount: number;
    currency: string;
    method: string;
}): void {
    posthog.capture('deposit_initiated', {
        amount: p.amount,
        currency: p.currency,
        payment_method: p.method,
    });
}

export function trackDepositCompleted(p: {
    txId: string;
    amount: number;
    currency: string;
    method: string;
    durationMs: number;
}): void {
    posthog.capture('deposit_completed', {
        transaction_id: p.txId,
        amount: p.amount,
        currency: p.currency,
        payment_method: p.method,
        duration_ms: p.durationMs,
    });
}

export function trackDepositFailed(p: {
    amount: number;
    currency: string;
    method: string;
    errorCode?: string;
    durationMs: number;
}): void {
    posthog.capture('deposit_failed', {
        amount: p.amount,
        currency: p.currency,
        payment_method: p.method,
        error_code: p.errorCode,
        duration_ms: p.durationMs,
    });
}

// ── Withdraw events ───────────────────────────────────────────────────────────

export function trackWithdrawInitiated(p: {
    amount: number;
    currency: string;
    method: string;
}): void {
    posthog.capture('withdraw_initiated', {
        amount: p.amount,
        currency: p.currency,
        payment_method: p.method,
    });
}

export function trackWithdrawCompleted(p: {
    txId: string;
    amount: number;
    currency: string;
    method: string;
    durationMs: number;
}): void {
    posthog.capture('withdraw_completed', {
        transaction_id: p.txId,
        amount: p.amount,
        currency: p.currency,
        payment_method: p.method,
        duration_ms: p.durationMs,
    });
}

export function trackWithdrawFailed(p: {
    amount: number;
    currency: string;
    method: string;
    errorCode?: string;
    durationMs: number;
}): void {
    posthog.capture('withdraw_failed', {
        amount: p.amount,
        currency: p.currency,
        payment_method: p.method,
        error_code: p.errorCode,
        duration_ms: p.durationMs,
    });
}

// ── Transfer events ───────────────────────────────────────────────────────────
// No recipient phone — it's PII and must not go to analytics.

export function trackTransferInitiated(p: {
    amount: number;
    currency: string;
}): void {
    posthog.capture('transfer_initiated', {
        amount: p.amount,
        currency: p.currency,
    });
}

export function trackTransferCompleted(p: {
    txId: string | null;
    amount: number;
    currency: string;
    durationMs: number;
}): void {
    posthog.capture('transfer_completed', {
        transaction_id: p.txId,
        amount: p.amount,
        currency: p.currency,
        duration_ms: p.durationMs,
    });
}

export function trackTransferFailed(p: {
    amount: number;
    currency: string;
    errorCode?: string;
    durationMs: number;
}): void {
    posthog.capture('transfer_failed', {
        amount: p.amount,
        currency: p.currency,
        error_code: p.errorCode,
        duration_ms: p.durationMs,
    });
}
