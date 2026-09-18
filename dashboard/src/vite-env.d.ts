/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INVENTORY_API_URL: string;
  readonly VITE_SHIPMENT_API_URL: string;
  readonly VITE_WAREHOUSE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
