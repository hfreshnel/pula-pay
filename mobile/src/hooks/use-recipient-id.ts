import { useState, useCallback, useRef } from "react";
import { resolveRecipientId } from "../api/wallet";
import { getApiError, type ApiErrorCode } from "../utils/api-error";

export function useRecipientId() {
    const [recipientId, setRecipientId] = useState<string | null>(null);
    const [errorKey, setErrorKey] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<ApiErrorCode | null>(null);
    const seqRef = useRef(0);

    const getPhoneUserId = useCallback(async (phone: string) => {
        const seq = ++seqRef.current;
        setErrorKey(null);
        setErrorCode(null);
        setRecipientId(null);
        try {
            const userId = await resolveRecipientId(phone);
            if (seq !== seqRef.current) return;
            setRecipientId(userId);
        } catch (e: unknown) {
            if (seq !== seqRef.current) return;
            const { code, translationKey } = getApiError(e);
            setErrorCode(code);
            setErrorKey(translationKey);
        }
    }, []);

    return { recipientId, errorKey, errorCode, getPhoneUserId };
}
