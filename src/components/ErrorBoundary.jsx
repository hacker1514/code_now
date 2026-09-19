import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex flex-col items-center justify-center h-screen w-screen bg-[#0d1117] text-slate-100 p-6 text-center select-none font-sans">
					<div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
						<AlertTriangle size={48} />
					</div>
					<h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
					<p className="text-sm text-slate-400 max-w-md mb-6 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 text-rose-300">
						{this.state.error?.message || "An unexpected error occurred."}
					</p>
					<button
						onClick={() => window.location.reload()}
						className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
					>
						<RefreshCw size={16} />
						Reload Application
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
