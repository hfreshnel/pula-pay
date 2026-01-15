import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell } from "lucide-react-native";
import { useTheme } from "@/src/theme";
import type { Theme } from "@/src/theme/types";

export default function BrandHeader() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const styles = getStyles(theme, insets.top);

    const handleNotifications = () => {
        console.log("Notifications pressed");
    };

    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                <LinearGradient
                    colors={[theme.colors.primary, '#06b6d4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <Text style={styles.logo}>P</Text>
                </LinearGradient>
                <Text style={styles.brandName}>Pulapay</Text>
            </View>
            <TouchableOpacity
                style={styles.bellButton}
                onPress={handleNotifications}
                activeOpacity={0.7}
            >
                <Bell
                    color={theme.colors.text}
                    size={24}
                    strokeWidth={2}
                />
            </TouchableOpacity>
        </View>
    );
}

const getStyles = (theme: Theme, topInset: number) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: topInset + theme.spacing.s,
        paddingBottom: theme.spacing.s,
        paddingHorizontal: theme.spacing.m,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    gradient: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.l,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        fontSize: 20,
        color: theme.colors.onPrimary,
        fontWeight: 'bold',
    },
    brandName: {
        ...theme.typography.h2,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    bellButton: {
        padding: theme.spacing.xs,
        borderRadius: theme.borderRadius.m,
    },
});