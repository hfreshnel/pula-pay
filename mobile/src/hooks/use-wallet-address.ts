import { useCallback, useEffect, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { getWalletAddress } from "../api/wallet";

type ApiError = { response?: { data?: { error?: string } }; message?: string };

export function useWalletAddress() {
    const [address, setAddress] = useState<string | null>(null);
    const [blockchain, setBlockchain] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        getWalletAddress()
            .then(({ address, blockchain }) => {
                setAddress(address);
                setBlockchain(blockchain);
            })
            .catch((e: unknown) => {
                const err = e as ApiError;
                setError(err?.response?.data?.error || err.message || "Failed to load wallet address");
            })
            .finally(() => setLoading(false));
    }, []);

    const copyToClipboard = useCallback(async () => {
        if (address) {
            await Clipboard.setStringAsync(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [address]);

    const truncatedAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : null;

    return { address, truncatedAddress, blockchain, loading, error, copyToClipboard, copied };
}
