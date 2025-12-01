import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { API_URL } from "../constants/config";


const client = axios.create({
    baseURL: API_URL,
});

client.interceptors.request.use((config) => {
    
    const { token } = useAuthStore.getState() as { token?: string | null };
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default client;