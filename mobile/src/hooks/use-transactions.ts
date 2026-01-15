import { useCallback, useState } from "react";
import { getTransactionsList } from "../api/transactions";

export function useTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getTransactions = useCallback(async (userId: string) => {
        setError(null);
        setLoading(true);
        try {
            const { txs } = await getTransactionsList(userId);
            setTransactions(txs);
        } catch (e: any) {
            setError(e?.response?.data?.error || e.message || "Failed to get transactions");
        } finally {
            setLoading(false);
        }
    }, []);

    return { transactions, loading, error, getTransactions };
}