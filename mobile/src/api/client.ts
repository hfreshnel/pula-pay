import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";
import { API_URL } from "../constants/config";
import { logger } from "../utils/logger";

// Extend config to track request timing and retry state
interface TimedAxiosRequestConfig extends InternalAxiosRequestConfig {
    metadata?: { startTime: number };
    _retry?: boolean;
}

// Lazy import to avoid circular dependency:
// authStore -> users -> client -> authStore
//const getAuthStore = () => require("../store/authStore").useAuthStore;


const client = axios.create({
    baseURL: API_URL,
});

client.interceptors.request.use((config: TimedAxiosRequestConfig) => {
    const { token } = useAuthStore.getState();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Track request start time
    config.metadata = { startTime: Date.now() };

    // Log outgoing request
    const method = config.method?.toUpperCase() ?? 'GET';
    const url = config.url ?? '';
    logger.debug('API', `→ ${method} ${url}`);

    return config;
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else if (token) {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};

client.interceptors.response.use(
    (response) => {
        const config = response.config as TimedAxiosRequestConfig;
        const method = config.method?.toUpperCase() ?? 'GET';
        const url = config.url ?? '';
        const status = response.status;
        const duration = config.metadata?.startTime
            ? Date.now() - config.metadata.startTime
            : 0;

        logger.info('API', `← ${method} ${url} ${status} (${duration}ms)`);
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as TimedAxiosRequestConfig | undefined;
        const method = originalRequest?.method?.toUpperCase() ?? 'GET';
        const url = originalRequest?.url ?? '';
        const status = error.response?.status ?? 0;
        const duration = originalRequest?.metadata?.startTime
            ? Date.now() - originalRequest.metadata.startTime
            : 0;

        // Extract error code from response if available
        const errorData = error.response?.data as { error?: { code?: string } } | undefined;
        const errorCode = errorData?.error?.code;

        logger.error('API', `✗ ${method} ${url} ${status} (${duration}ms)`, {
            code: errorCode,
            message: error.message,
        });

        // Handle 401 - attempt token refresh
        if (status === 401 && originalRequest && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue this request while refresh is in progress
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(client(originalRequest));
                        },
                        reject: (err: Error) => {
                            reject(err);
                        },
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const store = useAuthStore.getState();
            const refreshed = await store.refreshTokens();

            if (refreshed) {
                const newToken = useAuthStore.getState().token;
                processQueue(null, newToken);
                isRefreshing = false;

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return client(originalRequest);
            }

            // Refresh failed - logout and reject all queued requests
            processQueue(new Error('Token refresh failed'));
            isRefreshing = false;
            await store.logout();
        }

        return Promise.reject(error);
    }
);

export default client;