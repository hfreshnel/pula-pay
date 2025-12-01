import { TextInput, StyleSheet, Text, View, TextInputProps } from "react-native";
import { useTheme } from "../../theme";

type Props = TextInputProps & {
  label?: string;
};

export default function Input({ label, ...rest }: Props) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBackground,
            color: theme.text,
            borderColor: theme.border,
          },
        ]}
        placeholderTextColor={theme.placeholder}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 4, fontSize: 14 },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
});
