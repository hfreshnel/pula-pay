import api from "./api";

export async function register(req) {
    const { data } = await api.post("/auth/register", req);
    return data;
}

export async function login(req) {
    const { data } = await api.post("/auth/login", req);
    return data;
}

export async function verifyPhone(req) {
    const { data } = await api.post("/auth/verify", req);
    return data;
}

export async function me() {
    const { data } = await api.get("/me")
    return data;
}