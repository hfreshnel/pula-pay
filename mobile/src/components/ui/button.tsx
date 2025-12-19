import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import { useTheme } from "../../theme";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function Button({ title, onPress, loading = false, disabled = false }: Props) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: isDisabled ? theme.border : theme.primary }
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.primaryText} size="small" />
          <Text style={[styles.text, { color: theme.primaryText, marginLeft: 8 }]}>Envoi...</Text>
        </View>
      ) : (
        <Text style={[styles.text, { color: theme.primaryText }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 16,
    justifyContent: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
    fontSize: 16,
  },
});
