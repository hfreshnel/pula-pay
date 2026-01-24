import { useCallback, useState } from "react";
import { getMyTransactions } from "../api/wallet";
import type { TxDTO } from "../api/types";

type ApiError = { response?: { data?: { error?: string } }; message?: string };

export function useTransactions() {
    const [transactions, setTransactions] = useState<TxDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTransactions = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const txs = await getMyTransactions();
            setTransactions(txs);
        } catch (e: unknown) {
            const err = e as ApiError;
            setError(err?.response?.data?.error || err.message || "Failed to get transactions");
        } finally {
            setLoading(false);
        }
    }, []);

    return { transactions, loading, error, getTransactions };
}