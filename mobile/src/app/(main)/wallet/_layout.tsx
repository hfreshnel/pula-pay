import { Stack } from "expo-router";

export default function TransferStack() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="deposit" />
            <Stack.Screen name="receive" />
            <Stack.Screen name="transfert" />
            <Stack.Screen name="withdraw" />
        </Stack>
    );
}