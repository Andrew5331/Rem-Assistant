import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { BACKEND_BASE_URL, REQUEST_TIMEOUT_MS } from '../config';

// ---------- Utilidades internas ----------

/**
 * fetch con timeout usando Promise.race.
 * Evita bugs de AbortController en React Native 0.86+ / Hermes y
 * no deja requests colgados sin respuesta.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('TIMEOUT'));
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      fetch(url, options),
      timeoutPromise,
    ]);
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Wrapper seguro para requests JSON: captura errores de red/timeout
 * y los convierte en mensajes amigables en español.
 */
async function safeJsonFetch(url, options = {}) {
  try {
    const res = await fetchWithTimeout(url, options);
    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      throw new Error(`Estado ${res.status}: ${errorBody}`);
    }
    return await res.json();
  } catch (error) {
    const msg = error?.message || String(error);
    if (msg === 'TIMEOUT') {
      throw new Error(
        'Rem tardó demasiado en responder (timeout). Revisa que el backend y Ollama/LLM estén corriendo.'
      );
    }
    if (
      msg.includes('canceled') ||
      msg.includes('cancelled') ||
      msg.includes('Network request failed') ||
      msg.includes('Failed to fetch') ||
      msg.includes('fetch failed')
    ) {
      throw new Error(
        `No pude conectar con el backend en ${BACKEND_BASE_URL}. ` +
        'Verifica que: (1) uvicorn esté corriendo, (2) Tailscale esté activo en tu celular, ' +
        '(3) la IP en src/config.js sea correcta.'
      );
    }
    throw new Error(`Error de backend: ${msg}`);
  }
}

// =====================================================================
// Chat de texto — Orquestador (Secretaría / Financiero / general)
// =====================================================================

export async function askBackend(text) {
  const data = await safeJsonFetch(`${BACKEND_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return data.reply;
}

// =====================================================================
// Chat de voz — Usa expo-file-system/legacy uploadAsync
// =====================================================================

export async function askBackendVoice(uri) {
  try {
    const fileUri =
      Platform.OS === 'android' && !uri.startsWith('file://')
        ? `file://${uri}`
        : uri;

    const multipartType =
      FileSystem.FileSystemUploadType?.MULTIPART ??
      FileSystem.UploadType?.MULTIPART ??
      1;

    const uploadResult = await FileSystem.uploadAsync(
      `${BACKEND_BASE_URL}/voice/query`,
      fileUri,
      {
        httpMethod: 'POST',
        uploadType: multipartType,
        fieldName: 'audio',
        mimeType: 'audio/m4a',
        parameters: {},
      }
    );

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      throw new Error(`Estado ${uploadResult.status}: ${uploadResult.body}`);
    }

    return JSON.parse(uploadResult.body);
  } catch (error) {
    const msg = error?.message || String(error);
    if (
      msg.includes('Could not connect') ||
      msg.includes('Network') ||
      msg.includes('canceled') ||
      msg.includes('cancelled') ||
      msg.includes('Failed to fetch') ||
      msg.includes('fetch failed')
    ) {
      throw new Error(
        `No pude conectar con el backend en ${BACKEND_BASE_URL}. ` +
        'Verifica que uvicorn esté corriendo y Tailscale esté activo en el celular.'
      );
    }
    throw new Error(`Error de voz: ${msg}`);
  }
}

// =====================================================================
// Agente de Secretaría (to-dos)
// =====================================================================

export async function getTodos() {
  const data = await safeJsonFetch(`${BACKEND_BASE_URL}/secretary/todos`);
  return data.todos || [];
}

export async function createTodo(title, due_date, priority) {
  return safeJsonFetch(`${BACKEND_BASE_URL}/secretary/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, due_date, priority }),
  });
}

export async function completeTodo(id) {
  return safeJsonFetch(`${BACKEND_BASE_URL}/secretary/todos/${id}/complete`, {
    method: 'POST',
  });
}

// =====================================================================
// Agente Financiero
// =====================================================================

export async function getCashFlow() {
  return safeJsonFetch(`${BACKEND_BASE_URL}/financial/cash-flow`);
}

export async function getTransactions() {
  const data = await safeJsonFetch(`${BACKEND_BASE_URL}/financial/transactions`);
  return data.transactions || [];
}

export async function createTransaction(payload) {
  return safeJsonFetch(`${BACKEND_BASE_URL}/financial/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getSavingsGoals() {
  const data = await safeJsonFetch(`${BACKEND_BASE_URL}/financial/savings-goals`);
  return data.savings_goals || [];
}

export async function getCreditCards() {
  const data = await safeJsonFetch(`${BACKEND_BASE_URL}/financial/credit-cards`);
  return data.credit_cards || [];
}

