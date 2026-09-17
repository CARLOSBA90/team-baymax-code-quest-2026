/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEMP_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
