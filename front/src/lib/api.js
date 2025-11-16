import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {"Content-Type": "application/json"}
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(import.meta.env.VITE_TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.request.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) { //Token expiré
            const tokenKey = import.meta.env.VITE_TOKEN_KEY;
            localStorage.removeItem(tokenKey);
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;