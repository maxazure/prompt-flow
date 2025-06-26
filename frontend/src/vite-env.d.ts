/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_URL?: string // 保持向后兼容
  readonly VITE_APP_ENV: string
  readonly VITE_APP_NAME: string
  readonly VITE_ENABLE_ANALYTICS?: string
  readonly VITE_GA_TRACKING_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
