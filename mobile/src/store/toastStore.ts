import { create } from 'zustand';
import type { ToastType } from '@/src/components/ui/toast';

export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastState {
    toasts: ToastItem[];
    showToast: (type: ToastType, message: string, duration?: number) => void;
    dismissToast: (id: string) => void;
    clearAll: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],

    showToast: (type, message, duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const newToast: ToastItem = { id, type, message, duration };

        set((state) => ({
            toasts: [...state.toasts, newToast],
        }));
    },

    dismissToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
    },

    clearAll: () => {
        set({ toasts: [] });
    },
}));

// Convenience functions for common toast types
export const toast = {
    success: (message: string, duration?: number) =>
        useToastStore.getState().showToast('success', message, duration),
    error: (message: string, duration?: number) =>
        useToastStore.getState().showToast('error', message, duration),
    info: (message: string, duration?: number) =>
        useToastStore.getState().showToast('info', message, duration),
    warning: (message: string, duration?: number) =>
        useToastStore.getState().showToast('warning', message, duration),
};
