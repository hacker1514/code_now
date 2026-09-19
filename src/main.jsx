import { createRoot } from "react-dom/client";
import "./index.css";
import React from "react";
import {
	createBrowserRouter,
	createRoutesFromElements,
	Navigate,
	Route,
	RouterProvider,
} from "react-router-dom";
import { Toaster } from "./components/ui/sonner.jsx";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import Playground from "./Pages/Playground.jsx";

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route errorElement={<ErrorBoundary />}>
			<Route path="/" element={<Playground />} />
			<Route path="/playground" element={<Playground />} />
			<Route path="*" element={<Navigate to="/" replace />} />
		</Route>
	),
	{
		basename: import.meta.env.BASE_URL,
	}
);

createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<ErrorBoundary>
			<RouterProvider router={router} />
			<Toaster richColors position="bottom-right" theme="dark" />
			<Analytics />
			<SpeedInsights />
		</ErrorBoundary>
	</React.StrictMode>
);

// Register PWA Service Worker for offline app loading
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		const swPath = `${import.meta.env.BASE_URL}sw.js`;
		navigator.serviceWorker
			.register(swPath)
			.then((reg) => console.log("Code Now PWA Service Worker registered:", reg.scope))
			.catch((err) => console.log("Service Worker registration failed:", err));
	});
}
