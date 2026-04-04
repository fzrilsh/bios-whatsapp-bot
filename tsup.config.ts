import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/index.ts',
        'src/handlers/**/*.ts',
        'src/commands/**/*.ts',
        'src/jobs/**/*.ts',
        'src/lib/**/*.ts',
        'src/config/**/*.ts',
        'src/core/**/*.ts',
        'src/database/**/*.ts',
        'src/services/**/*.ts',
        'src/utils/**/*.ts',
    ],
    format: ['esm'],
    clean: true,
    bundle: false,
    splitting: false,
    sourcemap: true,
    minify: true,
});