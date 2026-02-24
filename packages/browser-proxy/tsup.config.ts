import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/browser-proxy/index.ts'],
    format: ['esm'],
    dts: false,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    outDir: 'dist',
    tsconfig: 'tsconfig.build.json',
});
