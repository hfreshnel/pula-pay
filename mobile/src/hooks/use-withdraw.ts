import { useCallback, useEffect, useRef, useState } from "react";
import { createWithdraw, getTxStatus } from "../api/transactions";

export function useWithdraw() {
    const [txId, setTxId] = useState(null);
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const timer = useRef<any>(null);

    const startWithdraw = useCallback(async (payload: { 
        userId: string, amount: string, msisdn: string, currency: string}) => {
        setError(null);
        setLoading(true);
        setStatus("PENDING");
        try {
            const { txId } = await createWithdraw(payload);
            setTxId(txId);
        } catch (e: any) {
            setError(e?.response?.data?.error || e.message || "Failed to create withdraw");
            setStatus(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!txId) return;
        const tick = async () => {
            try {
                const { status } = await getTxStatus(txId);
                setStatus(status);
                if (status === "PENDING") {
                    timer.current = (typeof window !== "undefined" ? window.setTimeout : setTimeout)(tick, 1500);
                }
            } catch (error: any) {
                setError(error?.response?.data?.error || error.message || "Status error");
            }
        };
        tick();
        return () => {
            if (timer.current) (typeof window !== "undefined" ? window.clearTimeout : clearTimeout)(timer.current);
        };
    }, [txId]);

    return { txId, status, loading, error, startWithdraw };
}