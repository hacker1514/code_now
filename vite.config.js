import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
	base: process.env.VITE_BASE_PATH || "/code_now/",
	server: {
		host: "0.0.0.0",
		allowedHosts: ["f5546ea873db.ngrok-free.app"],
		proxy: {
			"/api/compiler": {
				target: "https://playground.nextleet.com",
				changeOrigin: true,
				secure: false,
			},
			"/api/ai": {
				target: "https://naipunyam-chatbot.rnit.ai",
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/api\/ai/, "/api"),
			},
		},
	},
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
