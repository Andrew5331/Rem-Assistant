// ============================================================
// CONFIGURACIÓN DE REM — EDITA ESTOS VALORES
// ============================================================
// URL del backend (FastAPI). Con Tailscale instalado en tu PC y tu
// celular, usa la IP de Tailscale del PC (empieza por 100.x.y.z),
// así no dependes de estar en la misma red Wi-Fi.
//
// Cómo ver tu IP de Tailscale: corre `tailscale ip -4` en el PC donde
// corre el backend.

export const BACKEND_BASE_URL = 'http://100.97.58.69:8000';

// Tiempo máximo (ms) que la app espera una respuesta del backend
export const REQUEST_TIMEOUT_MS = 45000;

