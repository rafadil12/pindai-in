import os from "node:os";
import path from "node:path";
import { generate } from "selfsigned";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function lanAddresses(): string[] {
  const found = new Set<string>();
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list ?? []) {
      const v4 = net.family === "IPv4" || (net.family as unknown) === 4;
      if (!v4 || net.internal || net.address.startsWith("169.254.")) continue;
      found.add(net.address);
    }
  }
  return [...found];
}

async function devCertificate() {
  const altNames = [
    { type: 2 as const, value: "localhost" },
    { type: 7 as const, ip: "127.0.0.1" },
    ...lanAddresses().map((ip) => ({ type: 7 as const, ip })),
  ];
  return generate([{ name: "commonName", value: "localhost" }], {
    keySize: 2048,
    algorithm: "sha256",
    extensions: [
      { name: "basicConstraints", cA: false },
      { name: "keyUsage", digitalSignature: true, keyEncipherment: true },
      { name: "extKeyUsage", serverAuth: true },
      { name: "subjectAltName", altNames },
    ],
  });
}

export default defineConfig(async () => {
  const certificate = await devCertificate();
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      https: {
        key: certificate.private,
        cert: certificate.cert,
      },
      fs: {
        allow: [path.resolve(__dirname, "..")],
      },
      proxy: {
        "/api": "http://127.0.0.1:8787",
        "/ws": {
          target: "http://127.0.0.1:8787",
          ws: true,
        },
      },
    },
  };
});
