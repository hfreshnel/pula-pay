import { Redirect } from "expo-router";
import { useAuthStore } from "../store/authStore";

export default function Index(){
    const token = useAuthStore((s) => s.token);

    if (!token) return <Redirect href="/(auth)/login" />;
    return <Redirect href="/(main)/dashboard" />;
}