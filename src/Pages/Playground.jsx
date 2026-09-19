import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { toast } from "sonner";
import {
	Play,
	RotateCcw,
	Terminal,
	FileText,
	Copy,
	Check,
	Maximize2,
	Minimize2,
	Settings,
	Keyboard,
	Trash2,
	X,
	CheckCircle2,
	XCircle,
	Clock,
	Zap,
	User,
	Columns,
	Rows,
	ChevronDown,
	Search,
	Download,
	WifiOff,
	Monitor,
	Smartphone,
	Info,
	Sparkles,
	Bot,
	Send,
	RefreshCw,
} from "lucide-react";
import { DEFAULT_CODE, LANGUAGE_VERSIONS } from "../utils/defaultCode";
import { Loading } from "../components/Loading";
import {
	analyzeCodeWithCodeNowAI,
	explainErrorWithCodeNowAI,
	sendCodeNowAIMessage,
	getCodeNowSystemContext,
} from "../utils/aiService";
import { MarkdownRenderer } from "../components/MarkdownRenderer";

export default function Playground() {
	const [language, setLanguage] = useState("python");
	const [code, setCode] = useState(DEFAULT_CODE.python);
	const [stdin, setStdin] = useState("");
	const [theme, setTheme] = useState("pure-black");
	const [fontSize, setFontSize] = useState(14);
	const [tabSize, setTabSize] = useState(4);
	const [wordWrap, setWordWrap] = useState("on");
	const [minimap, setMinimap] = useState(false);
	const [autoCloseBrackets, setAutoCloseBrackets] = useState(true);

	// Console Tab & Layout Split (Responsive default)
	const [activeTab, setActiveTab] = useState("output"); // 'output' | 'input'
	const [splitDirection, setSplitDirection] = useState(() => {
		return typeof window !== "undefined" && window.innerWidth < 768
			? "vertical"
			: "horizontal";
	});
	const [panelSize, setPanelSize] = useState(55); // 55% editor, 45% terminal
	const [isDragging, setIsDragging] = useState(false);

	// Execution states
	const [isExecuting, setIsExecuting] = useState(false);
	const [executionResult, setExecutionResult] = useState(null);

	// Code Now AI Assistant & Code Analysis State
	const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
	const [aiMessages, setAiMessages] = useState([
		{
			role: "assistant",
			content:
				"👋 Welcome to **Code Now AI Assistant**!\n\nI focus strictly on coding, program debugging, time/space complexity analysis, and algorithms. Click **AI Analyze** in the header or type your questions below to chat.",
		},
	]);
	const [aiContext, setAiContext] = useState(() => getCodeNowSystemContext());
	const [aiInputPrompt, setAiInputPrompt] = useState("");
	const aiChatEndRef = useRef(null);
	const aiInputRef = useRef(null);

	// Settings Custom Dropdowns State
	const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
	const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
	const themeDropdownRef = useRef(null);
	const tabDropdownRef = useRef(null);

	const scrollToAIChatBottom = () => {
		setTimeout(() => {
			aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
			aiInputRef.current?.focus();
		}, 100);
	};

	// Auto focus AI chat input whenever active tab switches to 'ai' or AI finishes analyzing
	useEffect(() => {
		if (activeTab === "ai") {
			setTimeout(() => {
				aiInputRef.current?.focus();
			}, 100);
		}
	}, [activeTab, isAIAnalyzing]);

	// Close settings dropdowns on click outside
	useEffect(() => {
		const handleClickOutsideSettings = (event) => {
			if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
				setIsThemeDropdownOpen(false);
			}
			if (tabDropdownRef.current && !tabDropdownRef.current.contains(event.target)) {
				setIsTabDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutsideSettings);
		return () => document.removeEventListener("mousedown", handleClickOutsideSettings);
	}, []);

	const extractCodeBlock = (text) => {
		if (!text) return null;
		const codeMatch = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
		return codeMatch ? codeMatch[1].trim() : null;
	};

	const handleAIAnalyzeCode = async () => {
		if (!code.trim()) {
			toast.error("Please enter code before running Code Now AI Analysis.");
			return;
		}

		setActiveTab("ai");
		setIsAIAnalyzing(true);
		setAiMessages((prev) => [
			...prev,
			{ role: "user", content: "🔍 Analyzing source code & execution state..." },
		]);
		scrollToAIChatBottom();

		try {
			const aiReply = await analyzeCodeWithCodeNowAI({
				code,
				language,
				executionResult,
				context: aiContext,
			});

			setAiMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
			setAiContext((prev) => [
				...prev,
				{ role: "user", content: `Analyze code for ${language}` },
				{ role: "assistant", content: aiReply },
			]);
			toast.success("Code Now AI Analysis completed!");
		} catch (err) {
			toast.error(err.message || "Code Now AI Analysis failed.");
			setAiMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: `⚠️ **Code Now AI Error**: ${err.message || "Failed to communicate with Code Now AI engine."}`,
				},
			]);
		} finally {
			setIsAIAnalyzing(false);
			scrollToAIChatBottom();
		}
	};

	const handleAIExplainError = async (errorText) => {
		setActiveTab("ai");
		setIsAIAnalyzing(true);
		setAiMessages((prev) => [
			...prev,
			{ role: "user", content: `🐞 Fix Error Request:\n\`\`\`\n${errorText}\n\`\`\`` },
		]);
		scrollToAIChatBottom();

		try {
			const aiReply = await explainErrorWithCodeNowAI({
				code,
				language,
				errorText,
				context: aiContext,
			});

			setAiMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
			setAiContext((prev) => [
				...prev,
				{ role: "user", content: `Diagnose error: ${errorText}` },
				{ role: "assistant", content: aiReply },
			]);
			toast.success("Code Now AI Error Diagnosis completed!");
		} catch (err) {
			toast.error(err.message || "Code Now AI Diagnosis failed.");
			setAiMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: `⚠️ **Code Now AI Error**: ${err.message || "Failed to communicate with Code Now AI engine."}`,
				},
			]);
		} finally {
			setIsAIAnalyzing(false);
			scrollToAIChatBottom();
		}
	};

	const handleAISendChat = async (customPrompt) => {
		const promptToSend = customPrompt || aiInputPrompt.trim();
		if (!promptToSend) return;

		setAiInputPrompt("");
		setActiveTab("ai");
		setIsAIAnalyzing(true);

		setAiMessages((prev) => [...prev, { role: "user", content: promptToSend }]);
		scrollToAIChatBottom();

		try {
			const aiReply = await sendCodeNowAIMessage(promptToSend, aiContext);
			setAiMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
			setAiContext((prev) => [
				...prev,
				{ role: "user", content: promptToSend },
				{ role: "assistant", content: aiReply },
			]);
		} catch (err) {
			toast.error(err.message || "Code Now AI response failed.");
			setAiMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: `⚠️ **Code Now AI Error**: ${err.message || "Failed to communicate with Code Now AI engine."}`,
				},
			]);
		} finally {
			setIsAIAnalyzing(false);
			scrollToAIChatBottom();
		}
	};

	const handleCopyText = (textToCopy, successMsg = "Copied to clipboard!") => {
		if (!textToCopy) return;
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard
				.writeText(textToCopy)
				.then(() => toast.success(successMsg))
				.catch(() => fallbackCopyText(textToCopy, successMsg));
		} else {
			fallbackCopyText(textToCopy, successMsg);
		}
	};

	const fallbackCopyText = (textToCopy, successMsg) => {
		try {
			const textArea = document.createElement("textarea");
			textArea.value = textToCopy;
			textArea.style.position = "fixed";
			textArea.style.left = "-999999px";
			textArea.style.top = "-999999px";
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			document.execCommand("copy");
			textArea.remove();
			toast.success(successMsg);
		} catch (err) {
			toast.error("Failed to copy text.");
		}
	};

	// Modals
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [showShortcutsModal, setShowShortcutsModal] = useState(false);
	const [showDeveloperModal, setShowDeveloperModal] = useState(false);

	// Cursor position & fullscreen
	const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [copied, setCopied] = useState(false);

	// Language Dropdown Custom State
	const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
	const [langSearch, setLangSearch] = useState("");
	const dropdownRef = useRef(null);

	// PWA Install & Standalone State
	const [deferredPrompt, setDeferredPrompt] = useState(null);
	const [isStandalone, setIsStandalone] = useState(() => {
		if (typeof window === "undefined") return false;
		return (
			window.matchMedia("(display-mode: standalone)").matches ||
			window.navigator.standalone === true
		);
	});
	const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
	const [isBannerDismissed, setIsBannerDismissed] = useState(
		() => typeof window !== "undefined" && localStorage.getItem("code_now_pwa_dismissed") === "true"
	);

	// Display installation suggestions if app is not running in standalone PWA mode
	const isInstallable = !isStandalone;

	const containerRef = useRef(null);
	const editorRef = useRef(null);

	useEffect(() => {
		document.title = "Code Now";
	}, []);

	// PWA install prompt listener
	useEffect(() => {
		const handleBeforeInstallPrompt = (e) => {
			e.preventDefault();
			setDeferredPrompt(e);
		};
		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
	}, []);

	// Close language dropdown on click outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsLangDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleInstallPWA = async () => {
		if (deferredPrompt) {
			deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;
			if (outcome === "accepted") {
				setIsStandalone(true);
				toast.success("Code Now app installed successfully!");
			}
			setDeferredPrompt(null);
		} else {
			setShowInstallGuideModal(true);
		}
	};

	// Handle Drag Resizing
	useEffect(() => {
		const handleMouseMove = (e) => {
			if (!isDragging) return;
			if (splitDirection === "horizontal") {
				const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
				const newPercent = (e.clientX / containerWidth) * 100;
				if (newPercent > 20 && newPercent < 80) setPanelSize(newPercent);
			} else {
				const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
				const newPercent = (e.clientY / containerHeight) * 100;
				if (newPercent > 20 && newPercent < 80) setPanelSize(newPercent);
			}
		};

		const handleMouseUp = () => setIsDragging(false);

		if (isDragging) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		}
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, splitDirection]);

	// Monaco Language Mapping Helper
	function getMonacoLanguage(lang) {
		switch (lang) {
			case "c":
			case "cpp":
				return "cpp";
			case "bash":
				return "shell";
			case "csharp":
				return "csharp";
			case "haskell":
				return "haskell";
			default:
				return lang;
		}
	}

	// Handle Monaco Editor Mount
	const handleEditorDidMount = (editor, monaco) => {
		editorRef.current = editor;

		// Register Haskell Monarch Tokenizer for syntax highlighting
		try {
			monaco.languages.register({ id: "haskell" });
			monaco.languages.setMonarchTokensProvider("haskell", {
				keywords: [
					"case", "class", "data", "default", "deriving", "do", "else", "foreign",
					"if", "import", "in", "infix", "infixl", "infixr", "instance", "let",
					"module", "newtype", "of", "then", "type", "where", "_", "main", "putStrLn"
				],
				operators: [
					"=", "==", "/=", "<", "<=", ">", ">=", "+", "-", "*", "/", "++", "::", ".", "->", "<-", "=>"
				],
				tokenizer: {
					root: [
						[/[a-z_$][\w$]*/, {
							cases: {
								"@keywords": "keyword",
								"@default": "identifier"
							}
						}],
						[/[A-Z][\w$]*/, "type.identifier"],
						[/--.*/, "comment"],
						[/{-[\s\S]*?-}/, "comment"],
						[/"([^"\\]|\\.)*"/, "string"],
						[/'([^'\\]|\\.)*'/, "string"],
						[/\d+/, "number"],
					]
				}
			});
		} catch (e) {
			// Language registered natively
		}

		// Define Pure Black Theme
		monaco.editor.defineTheme("pure-black", {
			base: "vs-dark",
			inherit: true,
			rules: [],
			colors: {
				"editor.background": "#000000",
				"editor.lineHighlightBackground": "#0d0d0d",
				"editorLineNumber.foreground": "#444444",
				"editorLineNumber.activeForeground": "#a855f7",
				"editorGutter.background": "#000000",
				"editorWidget.background": "#050505",
				"editorWidget.border": "#1a1a1a",
				"input.background": "#000000",
				"dropdown.background": "#000000",
			},
		});

		monaco.editor.setTheme(theme);

		// Cursor Position Listener
		editor.onDidChangeCursorPosition((e) => {
			setCursorPosition({
				line: e.position.lineNumber,
				col: e.position.column,
			});
		});

		// Keyboard shortcut: Ctrl + Enter / Cmd + Enter to Run
		editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
			handleRunCodeRef.current();
		});
	};

	const handleLanguageChange = (newLang) => {
		setLanguage(newLang);
		setCode(DEFAULT_CODE[newLang] || "");
		setExecutionResult(null);
		toast.info(`Switched to ${LANGUAGE_VERSIONS[newLang]?.name}`);
	};

	const handleResetCode = () => {
		setCode(DEFAULT_CODE[language] || "");
		setExecutionResult(null);
		toast.info("Code reset to template.");
	};

	const handleCopyCode = () => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		toast.success("Code copied!");
		setTimeout(() => setCopied(false), 2000);
	};

	const clearOutput = () => {
		setExecutionResult(null);
		toast.info("Console cleared.");
	};

	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			containerRef.current?.requestFullscreen();
			setIsFullscreen(true);
		} else {
			document.exitFullscreen();
			setIsFullscreen(false);
		}
	};

	// Run code logic with Vite proxy /api/compiler/execute and fallback engine
	const handleRunCode = async () => {
		if (!code.trim()) {
			toast.error("Please enter code before executing.");
			return;
		}

		// PWA Offline Execution Check
		if (typeof navigator !== "undefined" && !navigator.onLine) {
			setIsExecuting(false);
			setActiveTab("output");
			setExecutionResult({
				status: "error",
				output: "⚠️ Connection Offline: Internet connection required for code execution.\n\nCode Now PWA runs locally offline, but code compilation and execution requires an active internet connection to communicate with compiler backend servers. Please reconnect to the internet and try again.",
				executionTime: "0.00s",
			});
			toast.error("Offline: Internet connection required for code execution.");
			return;
		}

		setIsExecuting(true);
		setActiveTab("output");
		setExecutionResult({ status: "running", output: "Compiling & executing code..." });

		let executionSuccess = false;
		const startTime = performance.now();

		// Attempt 1: NextLeet Compiler Backend (/api proxy or direct endpoint)
		const compilerEndpoints = [
			"/api/compiler/execute",
			"https://playground.nextleet.com/api/compiler/execute",
		];

		for (const endpoint of compilerEndpoints) {
			try {
				const response = await axios.post(
					endpoint,
					{
						sourceCode: code,
						language: language,
						stdin: stdin,
					},
					{ timeout: 15000 }
				);

				const endTime = performance.now();
				const duration = ((endTime - startTime) / 1000).toFixed(2);
				const data = response.data;

				let outputText = "";
				if (data.stdout) outputText += data.stdout;
				if (data.stderr) {
					if (outputText) outputText += "\n";
					outputText += `[Error]:\n${data.stderr}`;
				}
				if (data.compile_output) {
					if (outputText) outputText += "\n";
					outputText += `[Compiler Output]:\n${data.compile_output}`;
				}

				const isError = Boolean(data.stderr || (data.compile_output && !data.stdout));

				setExecutionResult({
					status: isError ? "error" : "success",
					output: outputText.trim() || "(No output produced)",
					executionTime: `${duration}s`,
				});

				if (!isError) {
					toast.success("Execution completed!");
				} else {
					toast.error("Execution produced errors.");
				}
				executionSuccess = true;
				break;
			} catch (err) {
				console.warn(`Compiler endpoint ${endpoint} attempt failed:`, err?.message);
			}
		}

		// Attempt 2: Judge0 CE CORS-enabled Execution Engine (100% CORS-friendly fallback for static GitHub Pages)
		if (!executionSuccess) {
			try {
				const judge0LangMap = {
					python: 71,
					cpp: 105,
					c: 103,
					java: 62,
					javascript: 93,
					typescript: 94,
					go: 106,
					rust: 108,
					csharp: 51,
					ruby: 72,
					php: 98,
					swift: 83,
					kotlin: 78,
					bash: 46,
					haskell: 61,
				};

				const langId = judge0LangMap[language] || 71;

				const res = await axios.post(
					"https://ce.judge0.com/submissions?wait=true",
					{
						source_code: code,
						language_id: langId,
						stdin: stdin || "",
					},
					{
						headers: { "Content-Type": "application/json" },
						timeout: 25000,
					}
				);

				const endTime = performance.now();
				const duration = ((endTime - startTime) / 1000).toFixed(2);
				const data = res.data;

				const stdout = data.stdout || "";
				const stderr = data.stderr || "";
				const compileOutput = data.compile_output || "";
				const statusDesc = data.status?.description || "";

				let outputText = stdout;
				if (stderr) {
					if (outputText) outputText += "\n";
					outputText += `[Error]:\n${stderr}`;
				}
				if (compileOutput) {
					if (outputText) outputText += "\n";
					outputText += `[Compiler Output]:\n${compileOutput}`;
				}

				const isError = Boolean(
					(data.status && data.status.id !== 3) || stderr || compileOutput
				);

				setExecutionResult({
					status: isError ? "error" : "success",
					output: outputText.trim() || statusDesc || "(No output produced)",
					executionTime: `${duration}s`,
				});

				if (!isError) {
					toast.success("Execution completed!");
				} else {
					toast.error(`Execution failed: ${statusDesc || "Produced errors"}`);
				}
				executionSuccess = true;
			} catch (judgeErr) {
				console.error("Judge0 execution fallback failed:", judgeErr?.message);
				setExecutionResult({
					status: "error",
					output: `Execution failed: ${judgeErr?.message || "Network Error"}`,
				});
				toast.error("Code execution failed. Please check network connection.");
			}
		}

		setIsExecuting(false);
	};

	const handleRunCodeRef = useRef(handleRunCode);
	handleRunCodeRef.current = handleRunCode;

	const activeLangConfig = LANGUAGE_VERSIONS[language] || { name: language, lang: language };

	return (
		<div
			ref={containerRef}
			className="flex flex-col h-screen w-screen bg-black text-slate-100 overflow-hidden font-sans select-none"
		>
			{/* Top Header */}
			<header className="flex items-center justify-between px-4 py-2 bg-black border-b border-neutral-900 z-20 shrink-0">
				{/* Logo & Language Selection */}
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2.5 cursor-pointer">
						<div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform duration-200">
							<div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center px-1">
								<span className="font-mono text-[11px] font-black tracking-tighter bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
									&lt;&gt;_
								</span>
							</div>
						</div>
						<span className="text-lg font-black tracking-wider text-white font-sans flex items-center gap-2">
							Code Now
							<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
						</span>
					</div>

					<div className="h-5 w-px bg-neutral-900 hidden sm:block" />

					{/* Custom Pure-Black Language Selector Dropdown */}
					<div className="relative" ref={dropdownRef}>
						<button
							type="button"
							onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
							className="bg-black text-white border border-neutral-800 rounded-lg px-3 py-1.5 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer hover:border-neutral-700 transition flex items-center gap-2 shadow-sm"
						>
							<span>{activeLangConfig.name}</span>
							<ChevronDown
								size={14}
								className={`text-neutral-400 transition-transform duration-200 ${
									isLangDropdownOpen ? "rotate-180" : ""
								}`}
							/>
						</button>

						{isLangDropdownOpen && (
							<div className="absolute top-full left-0 mt-1.5 w-64 bg-black border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden font-mono text-xs p-1.5 space-y-1">
								<div className="relative flex items-center px-2.5 py-1.5 bg-neutral-950 border border-neutral-900 rounded-lg">
									<Search size={13} className="text-neutral-500 mr-2 shrink-0" />
									<input
										type="text"
										value={langSearch}
										onChange={(e) => setLangSearch(e.target.value)}
										placeholder="Search language..."
										className="w-full bg-transparent text-white placeholder-neutral-600 focus:outline-none text-xs"
										autoFocus
									/>
									{langSearch && (
										<button
											type="button"
											onClick={() => setLangSearch("")}
											className="text-neutral-500 hover:text-white"
										>
											<X size={12} />
										</button>
									)}
								</div>

								<div className="max-h-64 overflow-y-auto hide-scrollbar space-y-0.5 pt-1">
									{Object.entries(LANGUAGE_VERSIONS)
										.filter(
											([key, config]) =>
												config.name.toLowerCase().includes(langSearch.toLowerCase()) ||
												key.toLowerCase().includes(langSearch.toLowerCase())
										)
										.map(([key, config]) => {
											const isSelected = language === key;
											return (
												<button
													key={key}
													type="button"
													onClick={() => {
														handleLanguageChange(key);
														setIsLangDropdownOpen(false);
														setLangSearch("");
													}}
													className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition text-left cursor-pointer ${
														isSelected
															? "bg-purple-950/50 border border-purple-800/60 text-purple-300 font-bold"
															: "hover:bg-neutral-900 text-neutral-300 hover:text-white border border-transparent"
													}`}
												>
													<span>{config.name}</span>
													{isSelected && <Check size={14} className="text-purple-400 shrink-0" />}
												</button>
											);
										})}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Right Control Bar */}
				<div className="flex items-center gap-2">
					{isInstallable && (
						<button
							type="button"
							onClick={handleInstallPWA}
							className="px-3 py-1.5 text-xs font-bold font-mono text-purple-300 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/80 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
							title="Install Code Now Desktop / Mobile App"
						>
							<Download size={14} />
							<span className="hidden sm:inline">Install App</span>
						</button>
					)}
					<button
						type="button"
						onClick={() =>
							setSplitDirection(splitDirection === "horizontal" ? "vertical" : "horizontal")
						}
						className="p-1.5 text-neutral-400 hover:text-white bg-black hover:bg-neutral-900 border border-neutral-800 rounded-lg transition hidden md:flex cursor-pointer"
						title={
							splitDirection === "horizontal"
								? "Switch to Vertical Split"
								: "Switch to Horizontal Split"
						}
					>
						{splitDirection === "horizontal" ? <Columns size={15} /> : <Rows size={15} />}
					</button>

					<button
						type="button"
						onClick={handleCopyCode}
						className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-black hover:bg-neutral-900 border border-neutral-800 rounded-lg transition flex items-center gap-1.5 font-mono cursor-pointer"
						title="Copy Code"
					>
						{copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
						<span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
					</button>

					<button
						type="button"
						onClick={handleResetCode}
						className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-black hover:bg-neutral-900 border border-neutral-800 rounded-lg transition flex items-center gap-1.5 font-mono cursor-pointer"
						title="Reset Code Template"
					>
						<RotateCcw size={14} />
						<span className="hidden sm:inline">Reset</span>
					</button>

					<button
						type="button"
						onClick={() => setShowDeveloperModal(true)}
						className="p-1.5 text-neutral-400 hover:text-white bg-black hover:bg-neutral-900 border border-neutral-800 rounded-lg transition cursor-pointer"
						title="About Developer"
					>
						<User size={16} />
					</button>

					<button
						type="button"
						onClick={() => setShowSettingsModal(true)}
						className="p-1.5 text-neutral-400 hover:text-white bg-black hover:bg-neutral-900 border border-neutral-800 rounded-lg transition cursor-pointer"
						title="IDE Settings"
					>
						<Settings size={16} />
					</button>

					<button
						type="button"
						onClick={() => setShowShortcutsModal(true)}
						className="p-1.5 text-neutral-400 hover:text-white bg-black hover:bg-neutral-900 border border-neutral-800 rounded-lg transition hidden sm:flex cursor-pointer"
						title="Keyboard Shortcuts"
					>
						<Keyboard size={16} />
					</button>

					<button
						type="button"
						onClick={toggleFullscreen}
						className="p-1.5 text-neutral-400 hover:text-white bg-black hover:bg-neutral-900 border border-neutral-800 rounded-lg transition hidden sm:flex cursor-pointer"
						title="Toggle Fullscreen"
					>
						{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
					</button>

					{/* AI Analyze Button */}
					<button
						type="button"
						onClick={handleAIAnalyzeCode}
						disabled={isAIAnalyzing}
						title="Analyze Code & Errors with AI"
						className="px-3 py-1.5 text-xs md:text-sm font-bold text-purple-200 bg-neutral-950 hover:bg-neutral-900 border border-purple-800/80 hover:border-purple-600 rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 font-mono"
					>
						<Sparkles size={15} className="text-purple-400 animate-pulse" />
						<span>{isAIAnalyzing ? "Analyzing..." : "AI Analyze"}</span>
					</button>

					{/* Primary Run Code Button */}
					<button
						type="button"
						onClick={handleRunCode}
						disabled={isExecuting}
						title="Run Code (Ctrl+Enter)"
						className="px-4 py-1.5 text-xs md:text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 rounded-lg shadow-lg shadow-purple-600/25 border border-purple-400/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 ml-1 font-mono"
					>
						<Play size={15} className="fill-white" />
						<span>{isExecuting ? "Running..." : "Run Code"}</span>
					</button>
				</div>
			</header>

			{/* Main Resizable Workspace Container */}
			<div
				className={`flex-1 flex overflow-hidden bg-black ${
					splitDirection === "horizontal" ? "flex-row" : "flex-col"
				}`}
			>
				{/* Editor Container */}
				<div
					style={
						splitDirection === "horizontal"
							? { width: `${panelSize}%`, height: "100%" }
							: { height: `${panelSize}%`, width: "100%" }
					}
					className="flex flex-col bg-black relative min-h-0 min-w-0"
				>
					<div className="flex-1 w-full h-full relative bg-black">
						<Editor
							height="100%"
							width="100%"
							loading={<Loading />}
							language={getMonacoLanguage(language)}
							theme={theme}
							value={code}
							onChange={(val) => setCode(val || "")}
							onMount={handleEditorDidMount}
							options={{
								fontSize: fontSize,
								tabSize: tabSize,
								fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
								fontLigatures: true,
								minimap: { enabled: minimap },
								scrollBeyondLastLine: false,
								automaticLayout: true,
								wordWrap: wordWrap,
								lineNumbers: "on",
								renderLineHighlight: "all",
								bracketPairColorization: { enabled: true },
								autoClosingBrackets: autoCloseBrackets
									? "always"
									: "languageDefined",
								autoClosingQuotes: "always",
								formatOnType: true,
								padding: { top: 12, bottom: 12 },
								cursorBlinking: "smooth",
								cursorSmoothCaretAnimation: "on",
								smoothScrolling: true,
							}}
						/>
					</div>
				</div>

				{/* Custom Draggable Resizable Handle */}
				<div
					onMouseDown={() => setIsDragging(true)}
					className={`${
						splitDirection === "horizontal"
							? "w-1.5 h-full cursor-col-resize"
							: "h-1.5 w-full cursor-row-resize"
					} bg-neutral-900 hover:bg-purple-600 active:bg-purple-500 transition-colors z-10 flex items-center justify-center shrink-0`}
				/>

				{/* Terminal Output Panel */}
				<div
					style={
						splitDirection === "horizontal"
							? { width: `${100 - panelSize}%`, height: "100%" }
							: { height: `${100 - panelSize}%`, width: "100%" }
					}
					className="flex flex-col bg-black overflow-hidden min-h-0 min-w-0"
				>
					{/* Console Header Tabs */}
					<div className="flex items-center justify-between border-b border-neutral-900 px-3 bg-black select-none py-1.5 shrink-0 z-10">
						<div className="flex gap-1">
							<button
								type="button"
								onClick={() => setActiveTab("output")}
								className={`px-3 py-1 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
									activeTab === "output"
										? "border-purple-500 text-purple-400 bg-black"
										: "border-transparent text-neutral-400 hover:text-white"
								}`}
							>
								<Terminal size={14} />
								<span className="font-mono">Output Terminal</span>
								{executionResult?.status === "success" && (
									<span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
								)}
								{executionResult?.status === "error" && (
									<span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setActiveTab("input")}
								className={`px-3 py-1 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
									activeTab === "input"
										? "border-purple-500 text-purple-400 bg-black"
										: "border-transparent text-neutral-400 hover:text-white"
								}`}
							>
								<FileText size={14} />
								<span className="font-mono">Custom Stdin</span>
							</button>

							<button
								type="button"
								onClick={() => setActiveTab("ai")}
								className={`px-3 py-1 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
									activeTab === "ai"
										? "border-purple-500 text-purple-400 bg-black"
										: "border-transparent text-neutral-400 hover:text-white"
								}`}
							>
								<Sparkles size={14} className="text-purple-400 animate-pulse" />
								<span className="font-mono">AI Analyzer & Chat</span>
								{isAIAnalyzing && (
									<span className="w-2 h-2 rounded-full bg-purple-500 animate-ping inline-block" />
								)}
							</button>
						</div>

						<div className="flex items-center gap-2">
							{executionResult && activeTab === "output" && (
								<button
									type="button"
									onClick={clearOutput}
									className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition cursor-pointer"
									title="Clear Console"
								>
									<Trash2 size={13} />
								</button>
							)}
						</div>
					</div>

					{/* Output Console Body (Persistent visibility via CSS) */}
					<div className="flex-1 p-3 overflow-hidden font-mono text-xs md:text-sm bg-black flex flex-col min-h-0 relative">
						{/* Output Tab Container */}
						<div
							className={`flex-1 flex-col bg-black min-h-0 h-full w-full ${
								activeTab === "output" ? "flex" : "hidden"
							}`}
						>
							{isExecuting ? (
								<div className="flex-1 flex flex-col items-center justify-center space-y-3 text-neutral-400">
									<Loading />
									<p className="animate-pulse font-mono text-xs text-neutral-300">
										Compiling & executing code...
									</p>
								</div>
							) : executionResult ? (
								<div className="space-y-3 flex-1 flex flex-col min-h-0 h-full">
									{/* Status Header Pill */}
									<div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-900 font-mono shrink-0">
										<div className="flex items-center gap-1.5 font-semibold">
											{executionResult.status === "success" ? (
												<>
													<CheckCircle2
														size={15}
														className="text-emerald-400"
													/>
													<span className="text-emerald-400 font-mono">
														Execution Succeeded
													</span>
												</>
											) : (
												<>
													<XCircle
														size={15}
														className="text-rose-400"
													/>
													<span className="text-rose-400 font-mono">
														Execution Failed
													</span>
													<button
														type="button"
														onClick={() => handleAIExplainError(executionResult.output)}
														className="ml-2 px-2.5 py-0.5 text-[11px] font-bold text-purple-300 bg-purple-950/80 hover:bg-purple-900 border border-purple-800 rounded-md transition flex items-center gap-1 cursor-pointer shadow-sm"
													>
														<Sparkles size={12} className="text-purple-400 animate-pulse" />
														<span>Fix with AI</span>
													</button>
												</>
											)}
										</div>

										{executionResult.executionTime && (
											<span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
												<Clock size={12} />
												Runtime: {executionResult.executionTime}
											</span>
										)}
									</div>

									{/* Console Output Display */}
									<pre className="whitespace-pre-wrap leading-relaxed text-neutral-100 select-text font-mono bg-black p-3 rounded-lg border border-neutral-900 flex-1 overflow-y-auto hide-scrollbar min-h-0">
										{executionResult.output}
									</pre>
								</div>
							) : (
								<div className="flex-1 flex flex-col items-center justify-center text-neutral-500 space-y-3 text-center p-4">
									<div className="p-3 rounded-full bg-black border border-neutral-900 text-purple-400">
										<Terminal size={32} />
									</div>
									<p className="font-mono text-xs text-neutral-400 max-w-xs leading-relaxed">
										Ready to compile. Press{" "}
										<strong className="text-white font-semibold">
											Run Code
										</strong>{" "}
										(or{" "}
										<kbd className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-neutral-300">
											Ctrl+Enter
										</kbd>
										) to view output.
									</p>
								</div>
							)}
						</div>

						{/* Stdin Tab Container */}
						<div
							className={`flex-1 flex-col space-y-2 bg-black min-h-0 h-full w-full ${
								activeTab === "input" ? "flex" : "hidden"
							}`}
						>
							<label className="text-xs text-neutral-400 font-mono shrink-0">
								Standard Input (stdin) fed into program execution:
							</label>
							<textarea
								value={stdin}
								onChange={(e) => setStdin(e.target.value)}
								placeholder="Paste standard input parameters here..."
								className="flex-1 w-full h-full bg-black text-white border border-neutral-900 rounded-lg p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none hide-scrollbar min-h-[140px]"
							/>
						</div>

						{/* AI Analyzer & Chat Tab Container */}
						<div
							className={`flex-1 flex-col bg-black min-h-0 h-full w-full ${
								activeTab === "ai" ? "flex" : "hidden"
							}`}
						>
							{/* Quick AI Action Pills */}
							<div className="flex items-center gap-2 pb-2.5 border-b border-neutral-900 overflow-x-auto hide-scrollbar shrink-0">
								<button
									type="button"
									onClick={() => handleAIAnalyzeCode()}
									disabled={isAIAnalyzing}
									className="px-2.5 py-1 text-[11px] font-bold text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
								>
									<Sparkles size={13} className="text-purple-400" />
									<span>Analyze Bugs & Logic</span>
								</button>
								<button
									type="button"
									onClick={() => handleAISendChat("Explain how this code works step by step.")}
									disabled={isAIAnalyzing}
									className="px-2.5 py-1 text-[11px] font-bold text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
								>
									<Bot size={13} className="text-cyan-400" />
									<span>Explain Code</span>
								</button>
								<button
									type="button"
									onClick={() => handleAISendChat("Analyze the time complexity (Big-O) and space complexity of this solution.")}
									disabled={isAIAnalyzing}
									className="px-2.5 py-1 text-[11px] font-bold text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
								>
									<Clock size={13} className="text-emerald-400" />
									<span>Time Complexity</span>
								</button>
								<button
									type="button"
									onClick={() => {
										setAiMessages([
											{
												role: "assistant",
												content:
													"👋 Welcome to **Code Now AI Assistant**!\n\nI focus strictly on coding, program debugging, time/space complexity analysis, and algorithms. Click **AI Analyze** in the header or type your questions below to chat.",
											},
										]);
										setAiContext(getCodeNowSystemContext());
										toast.info("Code Now AI Chat history reset.");
									}}
									className="px-2.5 py-1 text-[11px] font-bold text-neutral-400 hover:text-rose-400 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 rounded-lg transition flex items-center gap-1 cursor-pointer ml-auto shrink-0"
								>
									<RefreshCw size={12} />
									<span>Reset Chat</span>
								</button>
							</div>

							{/* AI Chat History */}
							<div className="flex-1 overflow-y-auto hide-scrollbar py-3 space-y-3 min-h-0">
								{aiMessages.map((msg, idx) => (
									<div
										key={idx}
										className={`flex flex-col ${
											msg.role === "user" ? "items-end" : "items-start"
										}`}
									>
										<div
											className={`max-w-[92%] rounded-xl p-3 text-xs leading-relaxed whitespace-pre-wrap font-mono select-text cursor-text ${
												msg.role === "user"
													? "bg-purple-950/80 border border-purple-800/80 text-purple-100"
													: "bg-neutral-950 border border-neutral-900 text-neutral-200"
											}`}
										>
											{msg.role === "assistant" && (
												<div className="flex items-center justify-between gap-1.5 text-purple-400 font-bold mb-1.5 border-b border-neutral-900 pb-1 select-none">
													<div className="flex items-center gap-1.5">
														<Bot size={14} />
														<span>Code Now AI Assistant</span>
													</div>
													<div className="flex items-center gap-1.5">
														<button
															type="button"
															onClick={() => handleCopyText(msg.content, "AI message copied to clipboard!")}
															className="p-1 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800 rounded transition flex items-center justify-center cursor-pointer"
															title="Copy entire AI message"
														>
															<Copy size={12} />
														</button>
													</div>
												</div>
											)}
											{msg.role === "assistant" ? (
												<MarkdownRenderer
													content={msg.content}
													onApplyCode={(newCode) => {
														setCode(newCode);
														toast.success("Applied AI code directly to editor!");
													}}
													onCopyText={handleCopyText}
												/>
											) : (
												<div className="whitespace-pre-wrap">{msg.content}</div>
											)}
										</div>
									</div>
								))}

								{isAIAnalyzing && (
									<div className="flex items-center gap-2 text-purple-400 font-mono text-xs p-2.5 bg-neutral-950 border border-neutral-900 rounded-xl w-fit">
										<Sparkles size={14} className="animate-spin" />
										<span>AI is thinking & analyzing code...</span>
									</div>
								)}
								<div ref={aiChatEndRef} />
							</div>

							{/* AI Input Chat Box */}
							<div className="pt-2 border-t border-neutral-900 shrink-0">
								<form
									onSubmit={(e) => {
										e.preventDefault();
										handleAISendChat();
									}}
									className="flex items-center gap-2 bg-neutral-950 border border-neutral-900 rounded-xl px-3 py-1.5 focus-within:border-purple-800 transition"
								>
									<input
										ref={aiInputRef}
										type="text"
										value={aiInputPrompt}
										onChange={(e) => setAiInputPrompt(e.target.value)}
										placeholder="Ask AI to fix bugs, optimize logic, or explain line..."
										disabled={isAIAnalyzing}
										className="w-full bg-transparent text-white placeholder-neutral-600 focus:outline-none font-mono text-xs"
									/>
									<button
										type="submit"
										disabled={isAIAnalyzing || !aiInputPrompt.trim()}
										className="p-1.5 text-purple-400 hover:text-white bg-purple-950 hover:bg-purple-900 rounded-lg transition cursor-pointer disabled:opacity-40 shrink-0"
									>
										<Send size={14} />
									</button>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Pure Black Status Bar */}
			<footer className="flex items-center justify-between px-3 py-1 bg-black border-t border-neutral-900 text-[11px] text-neutral-400 select-none font-mono shrink-0">
				<div className="flex items-center gap-4">
					<span className="flex items-center gap-1.5 font-semibold text-emerald-400">
						<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
						Code Now
					</span>

					<span>
						Ln {cursorPosition.line}, Col {cursorPosition.col}
					</span>

					<span className="hidden sm:inline">{code.length} chars</span>
				</div>

				<div className="flex items-center gap-4 font-mono">
					<span>Spaces: {tabSize}</span>
					<span>UTF-8</span>
					<span className="uppercase text-neutral-300 font-semibold">
						{activeLangConfig.name}
					</span>
				</div>
			</footer>

			{/* Settings Modal */}
			{showSettingsModal && (
				<div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
					<div className="bg-black border border-neutral-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-neutral-200">
						<div className="flex items-center justify-between border-b border-neutral-900 pb-3">
							<h2 className="text-base font-bold font-mono flex items-center gap-2 text-white">
								<Settings size={18} className="text-purple-400" />
								IDE Settings
							</h2>
							<button
								type="button"
								onClick={() => setShowSettingsModal(false)}
								className="p-1 text-neutral-400 hover:text-white rounded-lg transition"
							>
								<X size={18} />
							</button>
						</div>

						<div className="space-y-4 text-xs font-mono">
							<div className="flex items-center justify-between relative">
								<label className="text-neutral-300">Editor Theme</label>
								<div className="relative" ref={themeDropdownRef}>
									<button
										type="button"
										onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
										className="bg-black text-white border border-neutral-800 rounded-lg px-3 py-1.5 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer hover:border-neutral-700 transition flex items-center gap-2 shadow-sm"
									>
										<span>
											{theme === "pure-black"
												? "Pure Black (Default)"
												: theme === "vs-dark"
												? "VS Dark"
												: "High Contrast"}
										</span>
										<ChevronDown
											size={14}
											className={`text-neutral-400 transition-transform duration-200 ${
												isThemeDropdownOpen ? "rotate-180" : ""
											}`}
										/>
									</button>

									{isThemeDropdownOpen && (
										<div className="absolute right-0 top-full mt-1.5 w-52 bg-black border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden font-mono text-xs p-1.5 space-y-0.5">
											{[
												{ id: "pure-black", name: "Pure Black (Default)" },
												{ id: "vs-dark", name: "VS Dark" },
												{ id: "hc-black", name: "High Contrast" },
											].map((item) => (
												<button
													key={item.id}
													type="button"
													onClick={() => {
														setTheme(item.id);
														if (editorRef.current) {
															window.monaco?.editor?.setTheme(item.id);
														}
														setIsThemeDropdownOpen(false);
													}}
													className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition text-left cursor-pointer ${
														theme === item.id
															? "bg-purple-950/50 border border-purple-800/60 text-purple-300 font-bold"
															: "hover:bg-neutral-900 text-neutral-300 hover:text-white border border-transparent"
													}`}
												>
													<span>{item.name}</span>
													{theme === item.id && (
														<Check size={14} className="text-purple-400 shrink-0" />
													)}
												</button>
											))}
										</div>
									)}
								</div>
							</div>

							<div className="flex items-center justify-between">
								<label className="text-neutral-300">Font Size ({fontSize}px)</label>
								<input
									type="range"
									min={12}
									max={22}
									value={fontSize}
									onChange={(e) => setFontSize(Number(e.target.value))}
									className="accent-purple-500 cursor-pointer"
								/>
							</div>

							<div className="flex items-center justify-between relative">
								<label className="text-neutral-300">Tab Indentation</label>
								<div className="relative" ref={tabDropdownRef}>
									<button
										type="button"
										onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
										className="bg-black text-white border border-neutral-800 rounded-lg px-3 py-1.5 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer hover:border-neutral-700 transition flex items-center gap-2 shadow-sm"
									>
										<span>{tabSize} Spaces</span>
										<ChevronDown
											size={14}
											className={`text-neutral-400 transition-transform duration-200 ${
												isTabDropdownOpen ? "rotate-180" : ""
											}`}
										/>
									</button>

									{isTabDropdownOpen && (
										<div className="absolute right-0 top-full mt-1.5 w-40 bg-black border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden font-mono text-xs p-1.5 space-y-0.5">
											{[2, 4].map((size) => (
												<button
													key={size}
													type="button"
													onClick={() => {
														setTabSize(size);
														setIsTabDropdownOpen(false);
													}}
													className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition text-left cursor-pointer ${
														tabSize === size
															? "bg-purple-950/50 border border-purple-800/60 text-purple-300 font-bold"
															: "hover:bg-neutral-900 text-neutral-300 hover:text-white border border-transparent"
													}`}
												>
													<span>{size} Spaces</span>
													{tabSize === size && (
														<Check size={14} className="text-purple-400 shrink-0" />
													)}
												</button>
											))}
										</div>
									)}
								</div>
							</div>

							<div className="flex items-center justify-between">
								<label className="text-neutral-300">Auto Close Brackets</label>
								<button
									type="button"
									onClick={() => setAutoCloseBrackets(!autoCloseBrackets)}
									className={`px-3 py-1 text-xs rounded-lg border transition ${
										autoCloseBrackets
											? "bg-purple-950/60 border-purple-800 text-purple-300"
											: "bg-black border-neutral-800 text-neutral-400"
									}`}
								>
									{autoCloseBrackets ? "Enabled" : "Disabled"}
								</button>
							</div>

							<div className="flex items-center justify-between">
								<label className="text-neutral-300">Line Minimap</label>
								<button
									type="button"
									onClick={() => setMinimap(!minimap)}
									className={`px-3 py-1 text-xs rounded-lg border transition ${
										minimap
											? "bg-purple-950/60 border-purple-800 text-purple-300"
											: "bg-black border-neutral-800 text-neutral-400"
									}`}
								>
									{minimap ? "Enabled" : "Disabled"}
								</button>
							</div>
						</div>

						<div className="pt-2 flex justify-end">
							<button
								type="button"
								onClick={() => setShowSettingsModal(false)}
								className="px-4 py-2 text-xs font-bold font-mono bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition cursor-pointer"
							>
								Done
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Keyboard Shortcuts Modal */}
			{showShortcutsModal && (
				<div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
					<div className="bg-black border border-neutral-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-neutral-200">
						<div className="flex items-center justify-between border-b border-neutral-900 pb-3">
							<h2 className="text-base font-bold font-mono flex items-center gap-2 text-white">
								<Keyboard size={18} className="text-purple-400" />
								Keyboard Shortcuts
							</h2>
							<button
								type="button"
								onClick={() => setShowShortcutsModal(false)}
								className="p-1 text-neutral-400 hover:text-white rounded-lg transition"
							>
								<X size={18} />
							</button>
						</div>

						<div className="space-y-3 font-mono text-xs">
							<div className="flex items-center justify-between bg-black p-2.5 rounded-lg border border-neutral-900">
								<span className="text-neutral-300">Compile & Run Code</span>
								<kbd className="bg-neutral-950 text-purple-400 px-2 py-1 rounded border border-neutral-800 font-mono">
									Ctrl + Enter
								</kbd>
							</div>

							<div className="flex items-center justify-between bg-black p-2.5 rounded-lg border border-neutral-900">
								<span className="text-neutral-300">Copy Code</span>
								<kbd className="bg-neutral-950 text-purple-400 px-2 py-1 rounded border border-neutral-800 font-mono">
									Ctrl + C
								</kbd>
							</div>
						</div>

						<div className="pt-2 flex justify-end">
							<button
								type="button"
								onClick={() => setShowShortcutsModal(false)}
								className="px-4 py-2 text-xs font-bold font-mono bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition cursor-pointer"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Developer Info Modal (Niranjan Kumar K) */}
			{showDeveloperModal && (
				<div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
					<div className="bg-black border border-neutral-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-neutral-200">
						<div className="flex items-center justify-between border-b border-neutral-900 pb-3">
							<h2 className="text-base font-bold font-mono flex items-center gap-2 text-white">
								<User size={18} className="text-purple-400" />
								About Developer & Platform
							</h2>
							<button
								type="button"
								onClick={() => setShowDeveloperModal(false)}
								className="p-1 text-neutral-400 hover:text-white rounded-lg transition"
							>
								<X size={18} />
							</button>
						</div>

						<div className="space-y-4 font-mono text-xs leading-relaxed text-neutral-300">
							<div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl space-y-2">
								<div className="text-white font-bold text-sm flex items-center gap-2">
									<Zap size={16} className="text-purple-400" />
									Code Now Platform
								</div>
								<p className="text-neutral-400 text-xs">
									High-performance, pure-black online IDE supporting 21 programming languages with instant compilation and execution.
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between border-b border-neutral-900 pb-1">
									<span className="text-neutral-400">Lead Developer:</span>
									<span className="text-purple-400 font-bold text-sm">
										Niranjan Kumar K
									</span>
								</div>
								<div className="flex items-center justify-between border-b border-neutral-900 pb-1">
									<span className="text-neutral-400">Organization:</span>
									<span className="text-cyan-400 font-bold text-sm">
										kni.org
									</span>
								</div>
								<div className="flex items-center justify-between border-b border-neutral-900 pb-1">
									<span className="text-neutral-400">Platform:</span>
									<span className="text-white font-bold">Code Now IDE</span>
								</div>
								<div className="flex items-center justify-between border-b border-neutral-900 pb-1">
									<span className="text-neutral-400">AI Assistant:</span>
									<span className="text-purple-300 font-bold">Code Now AI</span>
								</div>
								<div className="flex items-center justify-between border-b border-neutral-900 pb-1">
									<span className="text-neutral-400">Supported Languages:</span>
									<span className="text-emerald-400 font-bold">21 Languages</span>
								</div>
							</div>
						</div>

						<div className="pt-2 flex justify-end">
							<button
								type="button"
								onClick={() => setShowDeveloperModal(false)}
								className="px-4 py-2 text-xs font-bold font-mono bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition cursor-pointer"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Floating Bottom PWA Install Banner */}
			{isInstallable && !isBannerDismissed && (
				<div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
					<div className="flex items-center gap-3 bg-black/95 border border-purple-800/80 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md text-xs font-mono text-neutral-200 select-none">
						<div className="flex items-center gap-2">
							<Download size={16} className="text-purple-400 animate-pulse shrink-0" />
							<span>Install <strong>Code Now</strong> for instant desktop access</span>
						</div>
						<div className="flex items-center gap-2 ml-2">
							<button
								type="button"
								onClick={handleInstallPWA}
								className="px-3 py-1.5 font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition cursor-pointer shadow-md"
							>
								Install
							</button>
							<button
								type="button"
								onClick={() => {
									setIsBannerDismissed(true);
									localStorage.setItem("code_now_pwa_dismissed", "true");
								}}
								className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition cursor-pointer"
								title="Dismiss PWA prompt"
							>
								<X size={16} />
							</button>
						</div>
					</div>
				</div>
			)}

			{/* PWA Installation Guide Modal */}
			{showInstallGuideModal && (
				<div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
					<div className="bg-black border border-neutral-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-neutral-200 font-mono text-xs">
						<div className="flex items-center justify-between border-b border-neutral-900 pb-3">
							<h2 className="text-base font-bold font-mono flex items-center gap-2 text-white">
								<Download size={18} className="text-purple-400" />
								Install Code Now PWA
							</h2>
							<button
								type="button"
								onClick={() => setShowInstallGuideModal(false)}
								className="p-1 text-neutral-400 hover:text-white rounded-lg transition"
							>
								<X size={18} />
							</button>
						</div>

						<div className="space-y-4 leading-relaxed">
							<p className="text-neutral-300">
								Install <strong>Code Now</strong> to launch it as a standalone app on your desktop or mobile home screen with instant offline loading!
							</p>

							<div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl space-y-2">
								<div className="text-purple-400 font-bold flex items-center gap-2">
									<Monitor size={15} /> Chrome / Edge (Desktop)
								</div>
								<p className="text-neutral-400">
									Click the <strong>Install Icon (⊕)</strong> at the right side of your browser address bar, or click browser menu (⋮) → <em>Install Code Now...</em>
								</p>
							</div>

							<div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl space-y-2">
								<div className="text-cyan-400 font-bold flex items-center gap-2">
									<Smartphone size={15} /> iOS Safari / Android
								</div>
								<p className="text-neutral-400">
									On iOS Safari, tap <strong>Share</strong> → <strong>Add to Home Screen</strong>. On Android Chrome, tap menu (⋮) → <strong>Add to Home screen</strong>.
								</p>
							</div>
						</div>

						<div className="pt-2 flex justify-end">
							<button
								type="button"
								onClick={() => setShowInstallGuideModal(false)}
								className="px-4 py-2 text-xs font-bold font-mono bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition cursor-pointer"
							>
								Got It
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
