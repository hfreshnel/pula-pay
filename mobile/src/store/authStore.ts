import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getMe } from '../api/users';
import { Platform } from 'react-native';
import { useWalletStore } from './walletStore';


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

type User = {
    id: string;
    phone: string;
};

type AuthStatus = "bootstrapping" | "authenticated" | "unauthenticated";

type AuthError = { code: "TOKEN_INVALID" | "NETWORK_ERROR" | "UNKNOWN"; message: string } | null;

type AuthState = {
    token: string | null;
    user: User | null;
    status: AuthStatus;
    error: AuthError;
    bootstrapped: boolean;

    bootstrap: () => Promise<void>;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
    token: null,
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
        if (!token) {
            set({
                token: null,
                user: null,
                status: "unauthenticated",
                error: null,
                bootstrapped: true,
            });
            return;
        }

        set({ token });

        try {
            const user = await getMe() as any;
            set({ user, status: "authenticated", bootstrapped: true });
        } catch (error) {
            await storage.removeItem("auth_token");
            set({
                token: null,
                user: null,
                status: "unauthenticated",
                error: { code: "TOKEN_INVALID", message: "Session expirée" },
                bootstrapped: true,
            });
        }
    },

    login: async (token: string) => {
        await storage.setItem("auth_token", token);
        set({ token, error: null });

        try {
            const user = await getMe() as any;
            set({ user, status: "authenticated" });
        } catch (error) {

            set({
                token: null,
                user: null,
                status: "unauthenticated",
                error: { code: "NETWORK_ERROR", message: "Connexion échouée" },
            });
        }
    },

    logout: async () => {
        await storage.removeItem("auth_token");
        useWalletStore.getState().reset();
        set({
            token: null,
            user: null,
            status: "unauthenticated",
            error: null,
            bootstrapped: true,
        });
    },

    refreshUser: async () => {
        try {
            const { data } = await getMe() as any;
            set({ user: data.userData ?? data });
        } catch (error) {
            set({
                error: { code: "NETWORK_ERROR", message: "Impossible de rafraîchir l'utilisateur" },
            });
        }
    },
}));