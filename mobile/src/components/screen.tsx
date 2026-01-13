import { ReactNode } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ViewStyle, StyleProp } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { useStyles } from "../hooks/use-styles";
import type { Theme } from "../theme/types";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  //edges?: ("top" | "bottom" | "left" | "right")[];
};

export default function Screen({
  children,
  scroll = false,
  style,
  contentStyle,
}: Props) {
  const theme = useTheme();
  const styles = useStyles((theme: Theme) => getStyles(theme));

  return (
    <SafeAreaView style={[styles.container, style]} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, contentStyle]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.inner, contentStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    inner: {
      flex: 1,
      padding: theme.spacing.m,
    },
    scrollContent: {
      flexGrow: 1,
    },
  });
