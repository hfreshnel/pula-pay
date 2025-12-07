import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getMe } from '../api/users';
import { Platform } from 'react-native';


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

type Status = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
    token: string | null;
    user: User | null;
    status: Status;
    error: string | null;

    bootstrap: () => Promise<void>;
    login: (token: string | null) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
    token: null,
    user: null,
    status: 'idle',
    error: null,

    bootstrap: async () => {
        set({ status: "loading", error: null });

        const token = await storage.getItem("auth_token");
        if (!token) {
            set({
                token: null,
                user: null,
                status: "unauthenticated",
                error: null,
            });
            return;
        }

        set({ token });

        try {
            const {data} = await getMe() as any;
            set({ user: data.userData ?? data, status: "authenticated" });
        } catch (error) {
            await storage.removeItem("auth_token");
            set({
                token: null,
                user: null,
                status: "unauthenticated",
                error: "Failed to fetch user data",
            });
        }
    },

    login: async (token) => {
    if (!token) {
      await storage.removeItem("auth_token");
      set({
        token: null,
        user: null,
        status: "unauthenticated",
        error: "Missing token",
      });
      return;
    }

    await storage.setItem("auth_token", token);
    set({ token, error: null });

    await get().bootstrap();
  },

    logout: async () => {
    await storage.removeItem("auth_token");
    set({
      token: null,
      user: null,
      status: "unauthenticated",
      error: null,
    });
  },

    refreshUser: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const data = await getMe() as any;
      set({ user: data.userData ?? data });
    } catch (error) {
    }
  },
}));