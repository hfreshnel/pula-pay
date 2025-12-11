import { ReactNode } from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { useTheme } from "../theme";

type Props = {
  children: ReactNode;
};

export default function Screen({ children }: Props) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 16 }
});
