import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Menu, Link2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme";
import { useStyles } from "@/src/hooks/use-styles";
import { FONTS, SIZES } from "@/src/constants/theme";
import type { Theme } from "@/src/theme/types";


export default function BrandHeader() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const s = useStyles(getStyles);

    return (
        <View style={[s.container, { paddingTop: insets.top + theme.spacing.s }]}>
            <TouchableOpacity style={s.iconButton} activeOpacity={0.7} onPress={() => router.push("/(main)/profile")}>
                <Menu color={theme.colors.onHero} size={SIZES.iconLg} strokeWidth={2} />
            </TouchableOpacity>

            <Text style={s.brandName}>Pulapay</Text>

            <TouchableOpacity style={s.iconButton} activeOpacity={0.7} onPress={() => router.push({ pathname: "/(main)/wallet/receive", params: { tab: "link" } })}>
                <Link2 color={theme.colors.onHero} size={SIZES.iconLg} strokeWidth={2} />
            </TouchableOpacity>
        </View>
    );
}

const getStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: theme.spacing.s,
        paddingHorizontal: theme.spacing.m,
        backgroundColor: theme.colors.heroBackground,
    },
    iconButton: {
        width: SIZES.iconLg + theme.spacing.m,
        height: SIZES.iconLg + theme.spacing.m,
        alignItems: "center",
        justifyContent: "center",
    },
    brandName: {
        fontFamily: FONTS.sansBold,
        fontSize: SIZES.brandFontSize,
        letterSpacing: -0.3,
        color: theme.colors.onHero,
    },
});
