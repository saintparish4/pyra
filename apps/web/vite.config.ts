import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			// Basic app-shell precaching only. Offline draft queue (Dexie +
			// background sync) is not implemented yet.
			manifest: {
				name: "Pyra",
				short_name: "Pyra",
				description:
					"Free, self-hostable records management for fire departments",
				theme_color: "#0f172a",
				background_color: "#0f172a",
				display: "standalone",
				start_url: "/",
				icons: [
					{
						src: "favicon.svg",
						sizes: "any",
						type: "image/svg+xml",
					},
				],
			},
		}),
	],
});
