import api from "./api";

export async function createDeposit(req) {
    const { data } = await api.post("/wallet/deposits", req);
    return data;
}

export async function createWithdraw(req) {
    const { data } = await api.post("/wallet/withdraw", req);
    return data;
}

export async function createTransfer(req) {
    const { data } = await api.post("/wallet/transfer", req);
    return data;
}

export async function getTxStatus(txId) {
    const { data } = await api.get(`/wallet/transactions/${txId}`);
    return data;
};

export async function getUserBalance(userId, currency = "EUR") {
    const { data } = await api.get(`/wallet/users/${userId}/balance`, { params: { currency } });
    return data;
}

export async function getRecipientId(senderId, phone) {
    const { data } = await api.get("/wallet/resolve-recipient", { params: { senderId, phone }});
    return data;
}

export async function getTransactionsList(userId) {
    const { data } = await api.get(`/wallet/users/${userId}/transactions`);
    return data;
}