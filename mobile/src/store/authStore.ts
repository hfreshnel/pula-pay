import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type AuthState = {
    token: string | null;
    setToken: (token: string | null) => Promise<void>;
    loadTokenFromStorage: () => Promise<void>;
    logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
    token: null,

    setToken: async (token) => {
        if (token) await SecureStore.setItemAsync("token", token);
        else await SecureStore.deleteItemAsync("token");
        set({ token });
    },

    loadTokenFromStorage: async () => {
        const token = await SecureStore.getItemAsync("token");
        if (token) {
            set({ token });
        }
    },

    logout: async () => {
        await SecureStore.deleteItemAsync("token");
        set({ token: null });
    },
}));