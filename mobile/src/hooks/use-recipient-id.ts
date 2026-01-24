import { useState, useCallback } from "react";
import { resolveRecipientId } from "../api/wallet";
import { getApiError, type ApiErrorCode } from "../utils/api-error";

export function useRecipientId() {
    const [recipientId, setRecipientId] = useState<string | null>(null);
    const [errorKey, setErrorKey] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<ApiErrorCode | null>(null);

    const getPhoneUserId = useCallback(async (phone: string) => {
        setErrorKey(null);
        setErrorCode(null);
        setRecipientId(null);
        try {
            const userId = await resolveRecipientId(phone);
            setRecipientId(userId);
        } catch (e: unknown) {
            const { code, translationKey } = getApiError(e);
            setErrorCode(code);
            setErrorKey(translationKey);
        }
    }, []);

    return { recipientId, errorKey, errorCode, getPhoneUserId };
}