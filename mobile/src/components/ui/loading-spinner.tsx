import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../../theme";
import { useStyles } from "../../hooks/use-styles";
import type { Theme } from "../../theme/types";

type Props = {
  message?: string;
  fullscreen?: boolean;
  size?: "small" | "large";
};

export default function LoadingSpinner({
  message,
  fullscreen = true,
  size = "large",
}: Props) {
  const theme = useTheme();
  const styles = useStyles((theme: Theme) => getStyles(theme, fullscreen));

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

const getStyles = (theme: Theme, fullscreen: boolean) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: fullscreen ? theme.colors.background : "transparent",
      flex: fullscreen ? 1 : undefined,
    },
    text: {
      ...theme.typography.caption,
      color: theme.colors.text,
      marginTop: theme.spacing.s,
    },
  });
