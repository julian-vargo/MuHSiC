import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 4321,
    allowedHosts: ["127.0.0.1", "localhost", "muhsic.ucsc.edu"],
  },
});