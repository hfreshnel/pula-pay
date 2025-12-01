import client from "./client";

export async function getMe() {
    const data = await client.get("/me");
    return data;
}