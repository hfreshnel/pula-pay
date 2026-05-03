import "../i18n";
import { useEffect } from "react";
import { Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useFonts } from "expo-font";
import { useAuth } from "../lib/auth";
import { useTheme } from "../theme";
import { ToastContainer } from "../components/ui/toast-container";
import * as Sentry from "@sentry/react-native";
import { initSentry, sentryLogHandler, setSentryUser } from "../lib/error-reporting";
import { identifyUser } from "../lib/tracking";
import { logger } from "../utils/logger";

// Initialize crash reporting and wire the logger remote handler once at bundle
// load time, before any component mounts or any error can occur.
initSentry();
logger.setRemoteHandler(sentryLogHandler);

function RootLayout() {
    const theme = useTheme();
    const { isPending, user } = useAuth();
    const [fontsLoaded] = useFonts({
        "ProductSans-Regular": require("../../assets/fonts/ProductSans-Regular.ttf"),
        "ProductSans-Bold": require("../../assets/fonts/ProductSans-Bold.ttf"),
        "ProductSans-Italic": require("../../assets/fonts/ProductSans-Italic.ttf"),
        "ProductSans-BoldItalic": require("../../assets/fonts/ProductSans-BoldItalic.ttf"),
        "TimesNewRomanMTStd": require("../../assets/fonts/TimesNewRomanMTStd.ttf"),
        "TimesNewRomanMTStd-Bold": require("../../assets/fonts/TimesNewRomanMTStd-Bold.ttf"),
        "TimesNewRomanMTStd-Italic": require("../../assets/fonts/TimesNewRomanMTStd-Italic.ttf"),
    });

    // Identify the user in PostHog and Sentry whenever the authenticated identity
    // changes (login, session restore). user?.id prevents re-running on
    // unrelated re-renders.
    useEffect(() => {
        if (user) {
            identifyUser({
                id: user.id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                kycLevel: user.kycLevel,
                displayCurrency: user.displayCurrency,
                locale: user.locale,
            });
            setSentryUser({
                id: user.id,
                email: user.email,
                phoneNumber: user.phoneNumber,
            });
        }
    }, [user?.id]);

    if (isPending || !fontsLoaded) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: theme.colors.background,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <>
            <Slot />
            <ToastContainer />
        </>
    );
}

export default Sentry.wrap(RootLayout);
