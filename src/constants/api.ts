// src/constants/api.ts

// The server address. If it changes, change it here only.
export const API_BASE_URL =
    'http://192.168.100.115:8010/RAWMiddlewareServiceGateway/webresources/merchant/portal';

// The fixed key the server expects on every request. Set in .env.local.
export const API_ENCRYPT_KEY = process.env.EXPO_PUBLIC_API_ENCRYPT_KEY ?? '';

// true = demo login (no server needed), false = real server.
export const USE_DEMO_API = false;