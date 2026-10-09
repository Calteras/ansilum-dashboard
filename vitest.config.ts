import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        css: true,
        server: { deps: { inline: [/@radix-ui/] } },
        // Suppress noisy warnings
        onConsoleLog(log) {
            if (
                log.includes('ExperimentalWarning') ||
                log.includes('useRouter must be used inside') ||
                log.includes('act(...)')
            ) {
                return false
            }
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData',
                'src/components/ui/**', // Exclude shadcn UI components
                'src/routeTree.gen.ts',
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    },
    resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})