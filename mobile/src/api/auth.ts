import client from "./client";

export async function login(phone: string, password: string) {
    const { data } = await client.post("/auth/login", { phone, password });
    return data;
}

export async function register(phone: string, password: string) {
  const { data } = await client.post("/auth/register", { phone, password });
  return data;
}