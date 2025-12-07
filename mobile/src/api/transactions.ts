import client from "./client";

export async function createDeposit(req: any) {
    const { data } = await client.post("/wallet/deposits", req);
    return data;
}

export async function createWithdraw(req: any) {
    const { data } = await client.post("/wallet/withdraw", req);
    return data;
}

export async function createTransfer(req: any) {
    const { data } = await client.post("/wallet/transfer", req);
    return data;
}

export async function getTxStatus(txId: string) {
    const { data } = await client.get(`/wallet/transactions/${txId}`);
    return data;
};

export async function getTransactionsList(userId: string) {
    const { data } = await client.get(`/wallet/users/${userId}/transactions`);
    return data;
}

export async function getRecipientId(senderId: string, phone: string) {
    const { data } = await client.get("/wallet/resolve-recipient", { params: { senderId, phone }});
    return data;
}