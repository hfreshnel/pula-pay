import i18n from "i18next";
import { initReactI18next, Translation } from "react-i18next";
import * as Localization from "expo-localization";

import en from "./en.json";
import fr from "./fr.json";
import { compatibilityFlags } from "react-native-screens";
import { interpolate } from "react-native-reanimated";

i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    lng: Localization.getLocales()[0]?.languageCode || "fr",
    fallbackLng: "fr",
    resources: {
        en: { translation: en },
        fr: { translation: fr },
    },
    interpolation: {
        escapeValue: false,
    },
});