/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base de l'API (défaut : /api, proxifié vers le serveur en dev). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
