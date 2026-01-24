import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getMe } from '../api/users';
import { updateDisplayCurrency } from '../api/wallet';
import { refreshTokens as refreshTokensApi } from '../api/auth';
import { Platform } from 'react-native';
import { useWalletStore } from './walletStore';
import type { AuthState } from './types';
import type { DisplayCurrency } from '../api/types';

// Storage layer: use localStorage on web, SecureStore on native
const storage = {
    async getItem(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
        }
        return await SecureStore.getItemAsync(key);
    },
    async setItem(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, value);
            }
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },
    async removeItem(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
            }
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    }
};

export const useAuthStore = create<AuthState>((set, get) => ({
    token: null,
    refreshToken: null,
    user: null,
    status: 'bootstrapping',
    error: null,
    bootstrapped: false,

    bootstrap: async () => {
        if (get().bootstrapped) {
            return
        };

        set({ status: "bootstrapping", error: null });

        const token = await storage.getItem("auth_token");
        const refreshToken = await storage.getItem("refresh_token");

        if (!token) {
            set({
                token: null,
                refreshToken: null,
                user: null,
                status: "unauthenticated",
                error: null,
                bootstrapped: true,
            });
            return;
        }

        set({ token, refreshToken });

        try {
            const user = await getMe();
            set({ user, status: "authenticated", bootstrapped: true });

            // Sync wallet store with user's preferred currency
            if (user.displayCurrency) {
                useWalletStore.getState().setDisplayCurrency(user.displayCurrency);
            }
        } catch {
            // Try to refresh tokens before giving up
            const refreshed = await get().refreshTokens();
            if (refreshed) {
                try {
                    const user = await getMe();
                    set({ user, status: "authenticated", bootstrapped: true });
                    if (user.displayCurrency) {
                        useWalletStore.getState().setDisplayCurrency(user.displayCurrency);
                    }
                    return;
                } catch {
                    // Fall through to logout
                }
            }

            await storage.removeItem("auth_token");
            await storage.removeItem("refresh_token");
            set({
                token: null,
                refreshToken: null,
                user: null,
                status: "unauthenticated",
                error: { code: "TOKEN_INVALID", message: "Session expirée" },
                bootstrapped: true,
            });
        }
    },

    login: async (accessToken: string, refreshToken: string) => {
        await storage.setItem("auth_token", accessToken);
        await storage.setItem("refresh_token", refreshToken);
        set({ token: accessToken, refreshToken, error: null });

        try {
            const user = await getMe();
            set({ user, status: "authenticated" });

            // Sync wallet store with user's preferred currency
            if (user.displayCurrency) {
                useWalletStore.getState().setDisplayCurrency(user.displayCurrency);
            }
        } catch {
            set({
                token: null,
                refreshToken: null,
                user: null,
                status: "unauthenticated",
                error: { code: "NETWORK_ERROR", message: "Connexion échouée" },
            });
        }
    },

    logout: async () => {
        await storage.removeItem("auth_token");
        await storage.removeItem("refresh_token");
        useWalletStore.getState().reset();
        set({
            token: null,
            refreshToken: null,
            user: null,
            status: "unauthenticated",
            error: null,
            bootstrapped: true,
        });
    },

    refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
            return false;
        }

        try {
            const { accessToken, refreshToken: newRefreshToken } = await refreshTokensApi(refreshToken);
            await storage.setItem("auth_token", accessToken);
            await storage.setItem("refresh_token", newRefreshToken);
            set({ token: accessToken, refreshToken: newRefreshToken });
            return true;
        } catch {
            return false;
        }
    },

    refreshUser: async () => {
        try {
            const user = await getMe();
            set({ user });
        } catch {
            set({
                error: { code: "NETWORK_ERROR", message: "Impossible de rafraîchir l'utilisateur" },
            });
        }
    },

    setDisplayCurrency: async (currency: DisplayCurrency) => {
        const { user } = get();
        if (!user) return;

        try {
            // Update on backend
            await updateDisplayCurrency(currency);

            // Update local user state
            set({ user: { ...user, displayCurrency: currency } });

            // Sync with wallet store
            useWalletStore.getState().setDisplayCurrency(currency);
        } catch {
            set({
                error: { code: "NETWORK_ERROR", message: "Impossible de changer la devise" },
            });
        }
    },
}));
