import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        'index': 'src/index.ts',
    },
    format: ['esm'],
    dts: false,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    outDir: 'dist',
    tsconfig: 'tsconfig.build.json',
    platform: 'node',
    external: [
        '@ringai/*',
    ],
});
