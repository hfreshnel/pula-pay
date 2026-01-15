import { create } from "zustand";
import { createDeposit, createWithdraw, createTransfer, getMyBalance, getMyTransactions, getTxStatus } from "@/src/api/wallet";
import { TxStatus } from "@/src/api/types";
import { WalletState } from "./types";

export const useWalletStore = create<WalletState>((set, get) => ({
    balance: null,
    currency: "EUR",
    transactions: [],
    loading: false,
    error: null,

    fetchBalance: async () => {
        set({ loading: true, error: null });
        try {
            const balance = await getMyBalance(get().currency as any);
            set({ balance });
        } catch {
            set({ error: "Impossible de récupérer le solde" });
        } finally {
            set({ loading: false });
        }
    },

    fetchTransactions: async () => {
        set({ loading: true, error: null });
        try {
            const txs = await getMyTransactions();
            set({ transactions: txs });
        } catch {
            set({ error: "Impossible de charger l’historique" });
        } finally {
            set({ loading: false });
        }
    },

    deposit: async (req, opts) => {
        const { txId } = await createDeposit(req, opts);
        await get().trackTransaction(txId);
        return txId;
    },

    withdraw: async (req, opts) => {
        const { txId } = await createWithdraw(req, opts);
        await get().trackTransaction(txId);
        return txId;
    },

    transfer: async (req, opts) => {
        const { txId } = await createTransfer(req, opts);
        await get().trackTransaction(txId);
        return txId;
    },

    trackTransaction: async (txId: string) => {
        let status: TxStatus = "PENDING";

        while (status === "PENDING") {
            await new Promise((r) => setTimeout(r, 2000));
            status = await getTxStatus(txId);
        }

        await Promise.all([
            get().fetchBalance(),
            get().fetchTransactions(),
        ]);
    },

    reset: () => {
        set({
            balance: null,
            transactions: [],
            loading: false,
            error: null,
        });
    },
}));
