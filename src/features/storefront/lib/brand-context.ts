import { createContext, useContext, type CSSProperties } from 'react'

/**
 * The store's colour variables. Sheets and dialogs render in a portal outside
 * the storefront frame, so they read the variables from here and set them on
 * their own content.
 */
export const StoreBrandContext = createContext<CSSProperties>({})

export const useStoreBrand = () => useContext(StoreBrandContext)
