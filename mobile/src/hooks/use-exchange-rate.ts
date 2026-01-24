import { useCallback, useEffect, useState } from "react";
import { getExchangeRate } from "../api/wallet";
import type { DisplayCurrency, ExchangeRateDTO } from "../api/types";

type ApiError = { response?: { data?: { error?: string } }; message?: string };

const REFRESH_INTERVAL = 300000; // 60 seconds

export function useExchangeRate(currency: DisplayCurrency) {
    const [rate, setRate] = useState<ExchangeRateDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRate = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getExchangeRate(currency);
            setRate(data);
        } catch (e: unknown) {
            const err = e as ApiError;
            setError(err?.response?.data?.error || err.message || "Failed to load exchange rate");
        } finally {
            setLoading(false);
        }
    }, [currency]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        fetchRate();
        const interval = setInterval(fetchRate, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchRate]);

    const convert = useCallback((amountUsdc: string): string => {
        if (!rate) return "—";
        const value = parseFloat(amountUsdc) * parseFloat(rate.rate);
        return value.toFixed(2);
    }, [rate]);

    const convertToUsdc = useCallback((displayAmount: string): string => {
        if (!rate) return "0";
        const value = parseFloat(displayAmount) / parseFloat(rate.rate);
        return value.toFixed(6);
    }, [rate]);

    return { rate, loading, error, convert, convertToUsdc, refresh: fetchRate };
}
