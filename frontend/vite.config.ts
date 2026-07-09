import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import fs from "fs";
import path from "path";

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  const isLocalHttps = process.env.VITE_LOCAL_HTTPS === 'true';

  const getHttpsConfig = () => {
    if (!isDev || !isLocalHttps) return {};
    
    const keyPath = path.resolve('./dev-key.pem');
    const certPath = path.resolve('./dev.pem');
    
    try {
      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        return {
          https: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          }
        };
      }
    } catch {
      console.warn('⚠️  Error reading HTTPS certificates. Using HTTP.');
    }
    
    return {};
  };

  const findReactRouterChunk = (dir: string) => {
    const absoluteDir = path.resolve(dir);
    if (!fs.existsSync(absoluteDir)) return "";
    const files = fs.readdirSync(absoluteDir);
    let largestFile = "";
    let largestSize = 0;
    for (const file of files) {
      if (file.startsWith("chunk-") && file.endsWith(".mjs")) {
        const filePath = path.join(absoluteDir, file);
        const stat = fs.statSync(filePath);
        if (stat.size > largestSize) {
          largestSize = stat.size;
          largestFile = filePath;
        }
      }
    }
    return largestFile;
  };

  const reactRouterPath = isDev
    ? findReactRouterChunk("./node_modules/react-router/dist/development")
    : findReactRouterChunk("./node_modules/react-router/dist/production");

  return {
    plugins: [react(), wasm()],
    resolve: {
      alias: [
        { find: /^react-router$/, replacement: reactRouterPath },
        { find: /^@stacks\/connect$/, replacement: path.resolve("./node_modules/@stacks/connect/dist/index.js") },
      ],
    },
    server: {
      port: 3002,
      ...getHttpsConfig(),
      ...(isDev && {
        host: true,
        cors: true,
      }),
    },
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      include: ['buffer'],
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve('./index.html'),
          sw: path.resolve('./src/sw.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'sw') {
              return 'sw.js';
            }
            return 'assets/[name]-[hash].js';
          },
        },
      },
    },
  };
});
