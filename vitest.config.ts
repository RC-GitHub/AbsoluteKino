import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        fileParallelism: false,
        maxWorkers: 1,
        isolate: false,
    },
});
