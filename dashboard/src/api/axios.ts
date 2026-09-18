import axios, { type AxiosInstance } from "axios";

function createApiClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });
}

export const inventoryClient = createApiClient(
  import.meta.env.VITE_INVENTORY_API_URL,
);

export const shipmentClient = createApiClient(
  import.meta.env.VITE_SHIPMENT_API_URL,
);

export const warehouseClient = createApiClient(
  import.meta.env.VITE_WAREHOUSE_API_URL,
);

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data;
    if (typeof message === "object" && message !== null && "message" in message) {
      return String(message.message);
    }
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
