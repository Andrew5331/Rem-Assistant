import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
model_env = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
OLLAMA_MODEL = model_env if ":" in model_env else f"{model_env}:latest"

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")  # "ollama" | "google"
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY", "")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

EMAIL_IMAP_HOST = os.getenv("EMAIL_IMAP_HOST", "imap.gmail.com")
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS", "")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD", "")

BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
