import axios from "axios";
import { API_URL } from "../constants/config";

// Use a separate axios instance for auth to avoid circular dependency with client interceptors
const authClient = axios.create({
    baseURL: API_URL,
});

export type AuthResponse = {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    user: {
        id: string;
        phone: string;
        email?: string;
        displayCurrency: string;
    };
};

export type TokenResponse = {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
};

export async function login(phone: string, password: string): Promise<AuthResponse> {
    const { data } = await authClient.post("/auth/login", { phone, password });
    return data.data;
}

export async function register(phone: string, password: string): Promise<AuthResponse> {
    const { data } = await authClient.post("/auth/register", { phone, password });
    return data.data;
}

export async function requestOtp(phone: string): Promise<{ message: string; expiresIn: string; otp?: string }> {
    const { data } = await authClient.post("/auth/request-otp", { phone });
    return data.data;
}

export async function verify(phone: string, otp: string): Promise<AuthResponse> {
    const { data } = await authClient.post("/auth/verify-otp", { phone, otp });
    return data.data;
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
    const { data } = await authClient.post("/auth/refresh", { refreshToken });
    return data.data;
}