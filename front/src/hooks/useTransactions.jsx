import { useCallback, useState } from "react";
import { getTransactionsList } from "@/lib/momo";

export function useTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getTransactions = useCallback( async (userId) => {
        setError(null);
        setLoading(true);
        try {
            const { txs } = await getTransactionsList(userId);
            console.log("Fetched transactions:", txs);
            setTransactions(txs);
        } catch (e) {
            setError(e?.response?.data?.error || e.message || "Failed to get transactions");
        } finally {
            setLoading(false);
        }
    }, []);

    return { transactions, loading, error, getTransactions };
};