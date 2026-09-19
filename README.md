# Nova — Asistente Personal Multi-Agente con Control por Voz

Sistema completo para el taller: app móvil (Expo/React Native) + backend
local (FastAPI) con un **orquestador central** que enruta cada petición a
un **Agente de Secretaría** o un **Agente Financiero**, usando **Ollama**
(o Google AI Studio) como motor de LLM, **Supabase** como persistencia, y
**Tailscale** para conectar el celular al backend sin abrir puertos.

```
Celular (Expo Go)  ──Tailscale VPN──▶  Backend FastAPI (tu PC)
   Voz / Chat                              │
                                            ▼
                                 Orquestador (Intent Router)
                                    │                │
                             Agente Secretaría   Agente Financiero
                                    │                │
                               Ollama / Google AI Studio (LLM)
                                            │
                                            ▼
                                   Supabase (PostgreSQL)
```

---

## 1. Qué incluye el ZIP

```
nova-assistant/
├── App.js, app.json, package.json    # App móvil (Expo)
├── src/
│   ├── config.js                     # ⚠️ URL del backend (Tailscale)
│   ├── hooks/useVoiceCapture.js      # Grabación de voz (expo-audio)
│   ├── services/backendService.js    # Llama al backend (chat, voz, agentes)
│   └── screens/
│       ├── CoreScreen.js             # Dashboard + esfera de voz
│       ├── DrawerScreen.js           # Chat con el orquestador
│       ├── TasksScreen.js            # Agente de Secretaría (to-dos)
│       ├── FinanceScreen.js          # Agente Financiero
│       ├── ScheduleScreen.js         # Horario (local, sin backend)
│       └── NotesScreen.js            # Notas rápidas (local, sin backend)
└── backend/
    ├── requirements.txt
    ├── .env.example                  # ⚠️ Copia a .env y edítalo
    └── app/
        ├── main.py                   # Servidor FastAPI
        ├── orchestrator.py           # Enrutador de intenciones
        ├── llm_client.py             # Ollama / Google AI Studio
        ├── database.py               # Cliente Supabase
        ├── schema.sql                # ⚠️ Ejecuta esto en Supabase
        ├── agents/
        │   ├── secretary.py          # Agenda, to-dos, correo
        │   └── financial.py          # Transacciones, flujo de caja, metas
        └── routes/
            ├── chat.py, voice.py, secretary_routes.py,
            └── financial_routes.py, webhook.py
```

---

## 2. Instalación de herramientas

1. **Node.js** (v18+) y **Expo Go** en el celular (igual que antes).
2. **Python 3.10+** para el backend.
3. **Ollama** en tu PC, con un modelo que soporte bien instrucciones JSON:
   ```bash
   ollama pull llama3.2
   ollama serve
   ```
   (El taller también acepta Mistral; `llama3.2` es el recomendado por el
   documento del taller para esta arquitectura.)
4. **Tailscale** — https://tailscale.com/download — instálalo en tu PC
   **y** en tu celular, e inicia sesión con la misma cuenta en ambos. Esto
   les da una IP privada (tipo `100.x.y.z`) que se ven entre sí sin
   importar la red en la que estén (Wi‑Fi, datos móviles, etc.) y sin
   abrir puertos en tu router.
5. **Cuenta de Supabase** (gratis) — https://supabase.com — crea un
   proyecto nuevo.

---

## 3. Configurar Supabase

1. Entra a tu proyecto de Supabase → **SQL Editor** → pega el contenido
   completo de `backend/app/schema.sql` → Run. Esto crea las tablas de
   tareas, correos, transacciones, tarjetas, metas de ahorro y el log de
   conversación.
2. Ve a **Project Settings → API** y copia:
   - `Project URL` → lo pegarás como `SUPABASE_URL`
   - `service_role key` (no la `anon key`) → lo pegarás como `SUPABASE_KEY`

---

## 4. Configurar y correr el backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # En Windows. En Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env       # En Windows. En Mac/Linux: cp .env.example .env
```

Abre `backend/.env` y completa:
- `SUPABASE_URL` y `SUPABASE_KEY` (paso anterior)
- `OLLAMA_MODEL=llama3.2` (o el que hayas descargado)
- Si quieres leer correo (Agente de Secretaría): `EMAIL_ADDRESS` y
  `EMAIL_APP_PASSWORD` (ver nota abajo)

Corre el servidor:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verifica que funcione entrando a `http://localhost:8000/docs` — ahí ves
la documentación interactiva (Swagger) de todos los endpoints.

> **Contraseña de aplicación de Gmail:** ve a
> https://myaccount.google.com/apppasswords, activa la verificación en
> dos pasos si no la tienes, y genera una contraseña específica para
> "Correo" — esa es la que va en `EMAIL_APP_PASSWORD` (no tu contraseña
> normal de Gmail).

---

## 5. Configurar la app móvil para hablar con el backend

1. En tu PC, con Tailscale corriendo, obtén tu IP de Tailscale:
   ```bash
   tailscale ip -4
   ```
2. Abre `src/config.js` en el proyecto de Expo y reemplaza:
   ```js
   export const BACKEND_BASE_URL = 'http://TU_IP_DE_TAILSCALE:8000';
   ```
3. Corre la app:
   ```bash
   npm install
   npx expo install --fix
   npx expo start -c
   ```
4. Escanea el QR con Expo Go **en tu celular con Tailscale activo**
   (puedes probar incluso con datos móviles, no necesitas la misma Wi‑Fi
   — ese es justo el punto de usar Tailscale).

---

## 6. Cómo funciona el orquestador (enrutamiento de intenciones)

Cuando escribes o dices algo, el flujo es:

1. **Clasificación:** el backend le pide al LLM que devuelva un JSON:
   `{"agent": "secretary"|"financial"|"general", "action": "...", "params": {...}}`
2. **Ejecución:** el backend llama directamente a la función Python del
   agente correspondiente (ej. `financial.get_cash_flow()`), que consulta
   o modifica Supabase.
3. **Síntesis:** el resultado (datos estructurados) se le devuelve al LLM
   para que redacte una respuesta en lenguaje natural, en español.

Esto es una forma explícita y portable de "function calling" — funciona
igual con Llama 3.2, Mistral, o Google AI Studio, sin depender de que el
modelo soporte tool-calling nativo de Ollama.

**Ejemplos de frases que puedes probar:**
- "¿Cuánto dinero me queda disponible?" → Agente Financiero → `get_cash_flow`
- "Agrégame la tarea leer el capítulo 4 para mañana" → Secretaría → `add_todo`
- "Redacta una excusa para el profesor por incapacidad médica" → Secretaría → `draft_email`
- "Registra un gasto de 35000 en Rappi" → Financiero → `add_transaction`

---

## 7. Ingesta cero-fricción de transacciones bancarias (webhook)

El backend expone:
```
POST http://TU_IP_TAILSCALE:8000/webhook/bank-transaction
Body JSON: { "raw_text": "Bancolombia te informa compra por $45.000 en RAPPI..." }
```

El backend usa el LLM para extraer monto/comercio/categoría y lo guarda
automáticamente en Supabase. Cómo dispararlo automáticamente:

### iOS — Apple Shortcuts
1. Atajos → Automatización → Nueva automatización personal → "Correo recibido"
   → filtra por remitente (ej. tu banco).
2. Agrega la acción **Obtener contenido de URL**: método `POST`, URL del
   webhook de arriba, cuerpo JSON con `raw_text` = contenido del correo.
3. Desactiva "Preguntar antes de ejecutar" para que corra en segundo plano.

### Android — recomendado: Tasker / MacroDroid (sin código nativo)
1. Instala Tasker o MacroDroid.
2. Crea un perfil que detecte una notificación nueva de tu app bancaria
   (filtrando por app y palabras clave como "compra"/"transacción").
3. Acción: **HTTP Request POST** hacia el webhook, con el texto de la
   notificación como `raw_text` en el cuerpo JSON.

> **Nota sobre `NotificationListenerService` en React Native:** el
> documento del taller menciona esta alternativa (con
> `react-native-android-notification-listener`) como la más integrada,
> pero requiere código nativo de Android que **no funciona dentro de
> Expo Go** — necesitarías migrar a un "development build" de Expo
> (`expo-dev-client` / `eas build`). Si tu profesor exige esta ruta
> específicamente, dímelo y armamos esa migración aparte; para el resto
> del taller, Tasker/MacroDroid cumple el mismo requisito funcional
> (ingesta cero-fricción) sin salir de Expo Go.

---

## 8. Probar cada pieza por separado

| Qué probar | Cómo |
|---|---|
| Backend está vivo | `http://TU_IP_TAILSCALE:8000/health` desde el navegador del celular |
| Ollama responde | `curl http://localhost:11434/api/tags` en el PC |
| Supabase conectado | `http://localhost:8000/secretary/todos` debe devolver `{"todos": []}` sin error |
| Orquestador funciona | Swagger (`/docs`) → prueba `POST /chat` con `{"text": "hola"}` |
| Voz funciona | Desde la app, toca el micrófono en la pestaña "Nova" |
| Webhook funciona | Prueba `POST /webhook/bank-transaction` desde Swagger con un texto de ejemplo |

---

## 9. Nota técnica: expo-audio en vez de expo-av

Este proyecto usa **`expo-audio`** para grabar voz (no el antiguo `expo-av`,
que Expo descontinuó y ya no viene incluido en Expo Go). Si en algún
momento ves el error `Cannot find native module 'ExponentAV'`, significa
que algo en el código quedó usando `expo-av` — revisa que no haya quedado
ningún `import { Audio } from 'expo-av'` suelto; toda la grabación debe
pasar por `src/hooks/useVoiceCapture.js`.

---

## 10. Problemas comunes

- **"No pude conectar con el backend"** → revisa que `uvicorn` esté
  corriendo, que Tailscale esté activo en PC y celular, y que
  `BACKEND_BASE_URL` en `src/config.js` tenga la IP de Tailscale correcta
  (no la IP de Wi‑Fi local).
- **Error de Supabase al llamar `/secretary/todos`** → revisa que
  corriste `schema.sql` y que `SUPABASE_URL`/`SUPABASE_KEY` en `.env`
  sean correctos (usa la `service_role key`, no la `anon key`).
- **El LLM no devuelve JSON válido y el enrutador falla** → algunos
  modelos pequeños tienen problemas para seguir instrucciones de formato
  JSON. Si ves esto seguido, prueba con `llama3.2` (no la versión base de
  `llama3`) o cambia a Google AI Studio (`LLM_PROVIDER=google` en `.env`).
- **"No pude conectar con Ollama" desde el backend** → recuerda que ahora
  quien le habla a Ollama es el **backend** (`localhost:11434`, mismo
  computador), no la app móvil directamente — no necesitas exponer Ollama
  a la red, solo el backend FastAPI.
- **Error al instalar `av`/`faster-whisper` en Windows** ("Microsoft Visual
  C++ 14.0 or greater is required") → ya no debería pasar con las versiones
  actuales de `requirements.txt` (dejan que `pip` elija automáticamente una
  versión de `av` con instalador listo para tu versión de Python). Si aun
  así aparece, borra `venv`, créalo de nuevo y corre `pip install -r
  requirements.txt` una vez más — a veces `pip` cachea una resolución vieja.
