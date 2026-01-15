import axios, { Axios, AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";
import { API_URL } from "../constants/config";

// Lazy import to avoid circular dependency:
// authStore -> users -> client -> authStore
//const getAuthStore = () => require("../store/authStore").useAuthStore;


const client = axios.create({
    baseURL: API_URL,
});

client.interceptors.request.use((config) => {
    const { token } = useAuthStore.getState();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isLoggingOut = false;

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401) {
        const store = useAuthStore.getState();

        if (!isLoggingOut) {
            isLoggingOut = true;
            await store.logout();
            isLoggingOut = false;
        }
    }
    return Promise.reject(error);
  }
);

export default client;