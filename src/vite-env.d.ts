/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The POS API address (proxy target). Its origin is offered as "this POS's address". */
  readonly VITE_API_URL?: string
  /** Pre-fills the StreetFood platform address on the connect screen. */
  readonly VITE_STREETFOOD_PLATFORM_URL?: string
}
