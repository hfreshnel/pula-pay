import { create } from "zustand";
import { UIState } from "./types";

export const useUIStore = create<UIState>((set) => ({
    theme: "system",
    language: "fr",
    setTheme: (mode) => set({ theme: mode}),
    setLanguage: (language) => set ({ language }),
}));