import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

function rewriteCookie(cookie: string): string {
  // Cookies with __Secure- / __Host- prefix REQUIRE the Secure attribute by spec.
  // If Secure is stripped from them the browser silently rejects the Set-Cookie
  // header, so we must preserve it. Chrome treats localhost as a secure origin
  // anyway, so keeping Secure is safe and doesn't break http://localhost.
  const cookieName = cookie.split('=')[0].trim()
  const hasRequiredSecure =
    cookieName.startsWith('__Secure-') || cookieName.startsWith('__Host-')

  let result = cookie
    .replace(/;\s*Domain=[^;]*/gi, '') // Remove domain → browser binds to localhost
    .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
    .replace(/;\s*Path=[^;]*/gi, '; Path=/') // Ensure root path

  // Only strip Secure from unprefixed cookies; prefixed ones need it to be valid
  if (!hasRequiredSecure) {
    result = result.replace(/;\s*Secure\b/gi, '')
  }

  return result
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_API_URL } = loadEnv(mode, process.cwd(), 'VITE_')
  if (!VITE_API_URL) {
    throw new Error(`Missing VITE_API_URL for mode "${mode}"`)
  }
  const apiTarget = new URL(VITE_API_URL)
  if (!['http:', 'https:'].includes(apiTarget.protocol)) {
    throw new Error('VITE_API_URL must use http:// or https://')
  }

  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      proxy: {
        // GoFood's browser-bound OAuth cookie uses this backend callback path.
        // Keep the callback on the frontend origin so that cookie is sent.
        '/app/terrapos/webhooks/gofood/': {
          target: apiTarget.origin,
          changeOrigin: true,
          secure: true,
        },
        '/api': {
          target: apiTarget.href.replace(/\/$/, ''),
          // Rewrite Host for the upstream tunnel, but preserve the browser's
          // Origin so Better Auth can validate its configured trusted origins.
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: true,
          // Also used by vite preview, which inherits server.proxy.
          configure(proxy) {
            proxy.on('proxyRes', (response) => {
              const cookies = response.headers['set-cookie']
              if (cookies) {
                response.headers['set-cookie'] = cookies.map(rewriteCookie)
              }
            })
          },
        },
      },
    },
  }
})
