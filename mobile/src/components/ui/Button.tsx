import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../../theme";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
};

export default function Button({ title, onPress, loading }: Props) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: theme.primary }]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={theme.primaryText} />
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
    alignItems: "center",
    marginTop: 16,
  },
  text: {
    fontWeight: "600",
    fontSize: 16,
  },
});
