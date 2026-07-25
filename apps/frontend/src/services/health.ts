import api from "../api/client";

export async function getHealth() {
    const response = await api.get("/health");
    return response.data;
}