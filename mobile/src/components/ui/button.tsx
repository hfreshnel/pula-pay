import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, StyleProp, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "@/src/theme";
import { useStyles } from "@/src/hooks/use-styles";
import type { Theme } from "@/src/theme/types";

type Variant = "primary" | "secondary" | "outline" | "danger";

type Props = {
    title: string;
    onPress: () => void;
    loading?: boolean;
    loadingText?: string;
    disabled?: boolean;
    variant?: Variant;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    fullWidth?: boolean;
};

export default function Button({
    title,
    onPress,
    loading = false,
    loadingText,
    disabled = false,
    variant = "primary",
    style,
    textStyle,
    fullWidth = true,
}: Props) {
    //const theme = useTheme();
    const isDisabled = disabled || loading;
    const styles = useStyles((theme: Theme) => getStyles(theme, variant, isDisabled, fullWidth));

    return (
        <TouchableOpacity
            style={[styles.button, style]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled, busy: loading }}
        >
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={styles.text.color} size="small" />
                    <Text style={[styles.text, { marginLeft: 8 }, textStyle]}>
                        {loadingText ?? "Chargement..."}
                    </Text>
                </View>
            ) : (
                <Text style={[styles.text, textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const getStyles = (theme: Theme, variant: Variant, disabled: boolean, fullWidth: boolean) => {
    const variantStyles = {
        primary: {
            bg: theme.colors.primary,
            border: theme.colors.primary,
            text: theme.colors.onPrimary,
        },
        secondary: {
            bg: theme.colors.surfaceVariant,
            border: theme.colors.outline,
            text: theme.colors.text,
        },
        outline: {
            bg: "transparent",
            border: theme.colors.primary,
            text: theme.colors.primary,
        },
        danger: {
            bg: theme.colors.danger,
            border: theme.colors.danger,
            text: theme.colors.onPrimary,
        },
    }

    const currentVariant = variantStyles[variant];

    return StyleSheet.create({
        button: {
            borderRadius: theme.borderRadius.m,
            paddingVertical: theme.spacing.m,
            paddingHorizontal: theme.spacing.l,
            alignItems: "center",
            justifyContent: "center",
            marginTop: theme.spacing.m,
            borderWidth: 1,
            backgroundColor: disabled ? theme.colors.outline : currentVariant.bg,
            borderColor: disabled ? theme.colors.outline : currentVariant.border,
            alignSelf: fullWidth ? "stretch" : "center",
        },
        loadingContainer: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
        },
        text: {
            ...theme.typography.body,
            color: disabled ? theme.colors.textMuted : currentVariant.text,
        }
    });
};
