import { api, newIdempotencyKey } from "./api";

export async function createDeposit(req) {
    const { data } = await api.post("/deposits", req);
    return data;
}

export async function createWithdraw(req) {
    const { data } = await api.post("/withdraw", req);
    return data;
}

export async function getTxStatus(txId) {
    const { data } = await api.get(`/transactions/${txId}`);
    return data;
};

export async function getUserBalance(userId, currency = "EUR") {
    const { data } = await api.get(`/users/${userId}/balance`, { params: { currency } });
    return data;
}

