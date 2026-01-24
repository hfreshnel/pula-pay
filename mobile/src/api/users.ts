import client from "./client";
import { UserDTO, BalanceDTO } from "./types"

export async function getMe(): Promise<UserDTO> {
    const { data } = await client.get("auth/me");
    return data.data.user;
}

export async function getUserBalance(userId: string, currency: string): Promise<BalanceDTO> {
    const { data } = await client.get(`/wallet/users/balance`, {
        params: { currency },
    });
    return data;
}