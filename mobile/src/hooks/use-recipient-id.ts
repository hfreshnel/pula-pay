import { useState, useCallback } from "react";
import { getRecipientId } from "../api/transactions";

export function useRecipientId() {
    const [recipientId, setRecipientId] = useState<string | null>(null);
    const [error, setError] = useState(null);

    const getPhoneUserId = useCallback(async (senderId: string, phone: string) => {
        setError(null);
        try {
            const { userId } = await getRecipientId(senderId, phone);
            setRecipientId(userId);
        } catch (e: any) {
            setError(e?.response?.data?.error || e.message || "Failed to get user");
        }
    }, []);

    return { recipientId, error, getPhoneUserId };
}