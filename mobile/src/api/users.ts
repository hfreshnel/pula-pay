import client from "./client";

export async function getMe() {
    const data = await client.get("/me");
    return data;
}

export async function getUserBalance(userId: string, currency: string) {
    const { data } = await client.get(`/wallet/users/${userId}/balance`, {
        params: { currency },
    });
    return data;
}