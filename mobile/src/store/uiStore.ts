import { create } from "zustand";

type ThemeMode = "system" | "light" | "dark";
type Language = "fr" | "en";

type UIState = {
    theme: ThemeMode;
    language: Language;
    setTheme: (mode: ThemeMode) => void;
    setLanguage: (lang: Language) => void; 
};

export const useUIStore = create<UIState>((set) => ({
    theme: "system",
    language: "fr",
    setTheme: (mode) => set({ theme: mode}),
    setLanguage: (language) => set ({ language }),
}));