import { useEffect, useRef, useState } from "react";
import { getProjectFiles } from "../../services/api";

function cleanJsxCode(rawCode, filename = "") {
  if (!rawCode || typeof rawCode !== "string") return "";

  let code = rawCode;

  // 1. Remove all import statements (single-line, multi-line, bare imports like `import './App.css'`)
  code = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?/g, "");
  code = code.replace(/import\s+['"][^'"]+['"]\s*;?/g, "");
  code = code.replace(/^\s*import\s+.*$/gm, "");

  // 2. Transform all export statements
  const inferredName = filename
    ? filename.split("/").pop().replace(/\.[^/.]+$/, "").replace(/[^A-Za-z0-9_$]/g, "_")
    : "AnonymousComponent";

  // export default function Name(...) -> function Name(...)
  code = code.replace(/export\s+default\s+function\s+([A-Za-z0-9_$]+)/g, "function $1");
  // export default function(...) -> function InferredName(...)
  code = code.replace(/export\s+default\s+function\s*\(/g, `function ${inferredName}(`);
  // export default class Name -> class Name
  code = code.replace(/export\s+default\s+class\s+([A-Za-z0-9_$]+)/g, "class $1");
  // export default class -> class InferredName
  code = code.replace(/export\s+default\s+class\s*\(/g, `class ${inferredName} (`);
  // export default React.memo(Name) or memo(Name)
  code = code.replace(/export\s+default\s+(?:React\.)?memo\s*\(\s*([A-Za-z0-9_$]+)\s*\)\s*;?/g, "");
  // export default Name;
  code = code.replace(/export\s+default\s+([A-Za-z0-9_$]+)\s*;?/g, "");
  // export default (...) => ... -> const InferredName = (...) => ...
  code = code.replace(/export\s+default\s+/g, `const ${inferredName} = `);
  // export { a, b, c };
  code = code.replace(/export\s*\{[^}]*\}\s*;?/g, "");
  // export const / let / var / function / class
  code = code.replace(/export\s+(const|let|var|function|class|async\s+function)\s+/g, "$1 ");
  // Any leftover export lines
  code = code.replace(/^\s*export\s+default\s+.*$/gm, "");
  code = code.replace(/^\s*export\s+.*$/gm, "");

  return code;
}

function buildBlobUrl(rawFiles) {
  if (!rawFiles || typeof rawFiles !== "object") return null;

  // Normalize all Windows backslash paths to standard forward slashes
  const files = {};
  for (const [key, val] of Object.entries(rawFiles)) {
    files[key.replace(/\\/g, "/")] = val;
  }

  const fileKeys = Object.keys(files);
  const htmlKeys = fileKeys.filter((k) => k.endsWith(".html"));
  if (htmlKeys.length === 0) return null;

  const primaryHtmlKey =
    htmlKeys.find((k) => k === "index.html" || k.endsWith("/index.html")) ||
    htmlKeys[0];

  let html = files[primaryHtmlKey];
  if (!html || !html.trim()) return null;

  // Check if this project is a React / JSX project
  const jsxFiles = fileKeys.filter((k) => k.endsWith(".jsx") || k.endsWith(".tsx"));
  const isReact = jsxFiles.length > 0 || Object.values(files).some((c) => typeof c === "string" && (c.includes("import React") || c.includes("from \"react\"") || c.includes("from 'react'")));

  // ─── 0. Ensure Global Error Catcher in Head ──────────────────────────────
  const errorCatcherTag = `
<script>
  window.addEventListener('error', function(e) {
    console.error("Preview Global Error:", e.error || e.message);
    var root = document.getElementById("root") || document.body;
    if (root && (!root.innerText || root.innerText.trim() === "" || root.innerHTML.indexOf("Preview Runtime Notice") === -1)) {
      var errDiv = document.createElement("div");
      errDiv.style = "padding:24px;margin:20px;background:#16181f;border:1px solid #ef4444;border-radius:12px;color:#fca5a5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.5);";
      var msg = e.message || (e.error ? e.error.message : "A runtime error occurred in preview.");
      errDiv.innerHTML = "<h3 style='margin:0 0 8px 0;color:#f87171;font-size:16px;'>⚠️ Preview Runtime Notice</h3><p style='margin:0 0 16px 0;font-size:13px;line-height:1.5;color:#e2e4f0;'>" + msg + "</p><button onclick=\\"window.parent.postMessage({ type: 'PREVIEW_AUTO_FIX_REQUEST', error: " + JSON.stringify(msg) + " }, '*')\\" style='background:linear-gradient(180deg,#818693,#595e69);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;'>🤖 Auto-Fix with AI</button>";
      root.appendChild(errDiv);
    }
  });
</script>
`;
  if (html.includes("<head>")) {
    html = html.replace("<head>", `<head>\n${errorCatcherTag}`);
  } else {
    html = `<head>${errorCatcherTag}</head>\n${html}`;
  }

  // ─── 1. Ensure Tailwind CSS & Font CDN in head ───────────────────────────
  if (!html.includes("cdn.tailwindcss.com")) {
    const tailwindTag = '<script src="https://cdn.tailwindcss.com"></script>';
    html = html.replace("</head>", `  ${tailwindTag}\n</head>`);
  }

  // ─── 2. Inlining All CSS ───────────────────────────────────────────────────
  function cleanCssContent(rawCss) {
    if (!rawCss || typeof rawCss !== "string") return "";
    return rawCss
      .replace(/@import\s+['"]tailwindcss\/[^'"]+['"]\s*;?/gi, "/* tailwindcss via CDN */")
      .replace(/@tailwind\s+[a-z0-9_\-]+;?/gi, "/* tailwind directive */");
  }

  const cssMatches = [...html.matchAll(/<link[^>]+href=["']([^"']*\.css)["'][^>]*>/gi)];
  const inlinedCss = new Set();

  for (const match of cssMatches) {
    const rawHref = match[1];
    const cleanPath = rawHref.replace(/^\.\//, "").replace(/^\//, "");
    const rawContent =
      files[cleanPath] ||
      files[`src/${cleanPath}`] ||
      files[`public/${cleanPath}`] ||
      Object.entries(files).find(([k]) => k.endsWith(`/${cleanPath}`) || k === cleanPath)?.[1];

    if (rawContent) {
      const cssContent = cleanCssContent(rawContent);
      html = html.replace(match[0], `<style>\n/* Inlined: ${cleanPath} */\n${cssContent}\n</style>`);
      inlinedCss.add(cleanPath);
    }
  }

  // Inject any standalone CSS
  const remainingCss = Object.entries(files)
    .filter(([k]) => k.endsWith(".css") && !inlinedCss.has(k))
    .map(([k, c]) => `<style>\n/* Auto-injected: ${k} */\n${cleanCssContent(c)}\n</style>`)
    .join("\n");

  if (remainingCss) {
    html = html.replace("</head>", `${remainingCss}\n</head>`);
  }

  // ─── 3. Handling React / JSX Bundling ──────────────────────────────────────
  if (isReact) {
    // Collect helper/utility JS files (storage.js, api.js, utils, mockData, etc.)
    const helperJsFiles = fileKeys.filter(
      (k) =>
        k.endsWith(".js") &&
        !k.includes("server") &&
        !k.includes("test") &&
        !k.includes("vite.config") &&
        !k.includes("tailwind.config") &&
        !k.includes("postcss.config") &&
        !k.includes("babel.config") &&
        !k.includes("jest.config") &&
        !k.includes("webpack.config") &&
        !k.includes("eslint.config") &&
        !k.includes("rollup.config") &&
        !k.includes("main.js")
    );

    const helperCodes = [];
    for (const key of helperJsFiles) {
      let code = files[key] || "";
      if (!code.trim()) continue;
      const cleaned = cleanJsxCode(code, key);
      helperCodes.push(`// --- Helper Module: ${key} ---\n${cleaned}`);
    }

    // Collect all JSX & component code (put App.jsx last so all child components exist first)
    const componentCodes = [];
    const sortedJsxKeys = [...jsxFiles].sort((a, b) => {
      const isAppA = a.includes("App.jsx") || a.endsWith("/App.jsx");
      const isAppB = b.includes("App.jsx") || b.endsWith("/App.jsx");
      if (isAppA && !isAppB) return 1;
      if (!isAppA && isAppB) return -1;
      const isMainA = a.includes("main.jsx") || a.includes("index.jsx");
      const isMainB = b.includes("main.jsx") || b.includes("index.jsx");
      if (isMainA && !isMainB) return 1;
      if (!isMainA && isMainB) return -1;
      return a.localeCompare(b);
    });

    for (const key of sortedJsxKeys) {
      let code = files[key] || "";
      if (!code.trim() || key.includes("main.jsx") || key.includes("index.jsx")) continue;
      const cleaned = cleanJsxCode(code, key);
      componentCodes.push(`// --- Component: ${key} ---\n${cleaned}`);
    }

    // Comprehensive list of Lucide icons
    const importedIcons = new Set([
      "Play", "Pause", "PlayCircle", "PauseCircle", "SkipForward", "SkipBack", "FastForward", "Rewind",
      "Volume", "Volume1", "Volume2", "VolumeX", "Mute", "Music", "Radio", "Disc", "Headphones", "Mic", "MicOff",
      "Sliders", "SlidersHorizontal", "Shuffle", "Repeat", "Repeat1", "List", "ListMusic", "Maximize", "Maximize2",
      "Minimize", "Minimize2", "Activity", "Dumbbell", "Flame", "TrendingUp", "TrendingDown", "Plus", "PlusCircle",
      "Trash", "Trash2", "Edit", "Edit2", "Edit3", "Calendar", "Clock", "Award", "Target", "Check", "CheckCircle",
      "CheckCircle2", "X", "XCircle", "Search", "Zap", "User", "Users", "UserPlus", "UserCheck", "Settings",
      "Heart", "Star", "ShoppingBag", "ShoppingCart", "Filter", "ChevronRight", "ChevronLeft", "ChevronDown",
      "ChevronUp", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "RefreshCw", "RotateCw", "RotateCcw",
      "BarChart", "BarChart2", "BarChart3", "PieChart", "DollarSign", "CreditCard", "Sun", "Moon", "Eye",
      "EyeOff", "Lock", "Unlock", "Key", "Shield", "ShieldCheck", "ShieldAlert", "Mail", "Phone", "MapPin",
      "Compass", "Globe", "Send", "Share", "Share2", "Download", "Upload", "Folder", "File", "FileText",
      "Image", "Video", "Camera", "Layers", "Cpu", "HardDrive", "Server", "Database", "Terminal", "Code",
      "GitBranch", "Sparkles", "Smile", "HelpCircle", "Gamepad2", "Trophy", "Crown", "Medal", "Flag",
      "Grid", "CircleDot", "Circle", "Square", "CheckSquare", "Info", "AlertCircle", "AlertTriangle",
      "Bell", "Bookmark", "Briefcase", "Camera", "Clipboard", "Copy", "FolderPlus", "Home", "LayoutDashboard"
    ]);

    for (const code of Object.values(files)) {
      if (typeof code !== "string") continue;
      const iconMatches = [...code.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"](?:lucide-react|lucide|react-icons[^'"]*|@heroicons[^'"]*)['"]/g)];
      for (const m of iconMatches) {
        m[1].split(",").forEach((icon) => {
          const clean = icon.trim().split(/\s+as\s+/)[0].trim();
          if (clean && /^[A-Z][A-Za-z0-9_]*$/.test(clean)) {
            importedIcons.add(clean);
          }
        });
      }
    }

    const iconDeclarations = Array.from(importedIcons)
      .map((name) => `const ${name} = _icon('${name}');`)
      .join("\n  ");

    // React CDN dependencies + Babel standalone wrapper
    const reactRuntime = `
<!-- React & Babel Standalone CDN -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://unpkg.com/recharts/umd/Recharts.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script type="text/babel" data-presets="react,env">
  const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext, useReducer, useId } = React;

  // Universal Icon Factory for Lucide Icons
  const _icon = (name) => (props) => (
    <svg
      width={props?.size || props?.width || 20}
      height={props?.size || props?.height || 20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props?.color || "currentColor"}
      strokeWidth={props?.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props?.className || ""}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...(props?.style || {}) }}
    >
      <circle cx="12" cy="12" r="9" opacity="0.2" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );

  // Dynamic Lucide & UI Component Definitions
  ${iconDeclarations}

  // Universal React Hooks & Utility Fallbacks
  const useFavorites = () => ({
    favorites: [],
    isFavorite: () => false,
    toggleFavorite: () => {},
    addFavorite: () => {},
    removeFavorite: () => {},
  });
  const useTheme = () => ({ theme: 'dark', toggleTheme: () => {}, isDark: true });
  const useAudio = () => ({ isPlaying: false, play: () => {}, pause: () => {}, toggle: () => {}, progress: 0, duration: 180, setVolume: () => {} });
  const usePlayer = () => ({ currentTrack: null, isPlaying: false, play: () => {}, pause: () => {}, next: () => {}, prev: () => {} });
  const isFavorite = () => false;
  const toggleFavorite = () => {};
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  };
  const formatDuration = formatTime;

  // Recharts Bindings
  const _R = typeof Recharts !== 'undefined' ? Recharts : {};
  const _chartPlaceholder = (label, color) => ({ children, data, height }) => (
    <div style={{ width: '100%', height: typeof height === 'number' ? height : '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.15)', color, fontFamily: 'sans-serif', fontSize: '13px', gap: '6px', padding: '16px', boxSizing: 'border-box' }}>
      <span>{label}</span>
      {Array.isArray(data) && <span style={{ opacity: 0.5, fontSize: '11px' }}>{data.length} data points</span>}
    </div>
  );

  const ResponsiveContainer = _R.ResponsiveContainer || (({ children, width, height, style }) => (
    <div style={{ width: width || '100%', height: typeof height === 'number' ? height : 300, position: 'relative', ...style }}>
      {children}
    </div>
  ));
  const AreaChart     = _R.AreaChart    || _chartPlaceholder('📈 Area Chart',    '#818693');
  const LineChart     = _R.LineChart    || _chartPlaceholder('📉 Line Chart',    '#10b981');
  const BarChart      = _R.BarChart     || _chartPlaceholder('📊 Bar Chart',     '#3b82f6');
  const PieChart      = _R.PieChart     || _chartPlaceholder('🥧 Pie Chart',     '#f59e0b');
  const ComposedChart = _R.ComposedChart|| _chartPlaceholder('📊 Composed Chart','#8b5cf6');
  const ScatterChart  = _R.ScatterChart || _chartPlaceholder('🔵 Scatter Chart', '#06b6d4');
  const RadarChart    = _R.RadarChart   || _chartPlaceholder('🕸 Radar Chart',   '#ec4899');
  const RadialBarChart= _R.RadialBarChart|| _chartPlaceholder('🔴 Radial Chart', '#ef4444');
  const FunnelChart   = _R.FunnelChart  || _chartPlaceholder('🔺 Funnel Chart',  '#f97316');
  const Treemap       = _R.Treemap      || _chartPlaceholder('🗂 Treemap',        '#14b8a6');
  const Sankey        = _R.Sankey       || _chartPlaceholder('〰 Sankey',         '#a78bfa');

  const Area        = _R.Area        || (() => null);
  const Bar         = _R.Bar         || ((props) => <div style={{padding:'12px',background:'rgba(255,255,255,0.05)',borderRadius:'6px',textAlign:'center',fontSize:'12px'}}>📊 {props.name || 'Bar'}</div>);
  const Line        = _R.Line        || (() => null);
  const Pie         = _R.Pie         || (() => null);
  const Scatter     = _R.Scatter     || (() => null);
  const Radar       = _R.Radar       || (() => null);
  const RadialBar   = _R.RadialBar   || (() => null);
  const Funnel      = _R.Funnel      || (() => null);
  const Cell        = _R.Cell        || (() => null);
  const XAxis       = _R.XAxis       || (() => null);
  const YAxis       = _R.YAxis       || (() => null);
  const ZAxis       = _R.ZAxis       || (() => null);
  const CartesianGrid = _R.CartesianGrid || (() => null);
  const Tooltip     = _R.Tooltip     || (() => null);
  const Legend      = _R.Legend      || (() => null);
  const ReferenceLine = _R.ReferenceLine || (() => null);
  const ReferenceArea = _R.ReferenceArea || (() => null);
  const ReferenceDot  = _R.ReferenceDot  || (() => null);
  const PolarGrid   = _R.PolarGrid   || (() => null);
  const PolarAngleAxis = _R.PolarAngleAxis || (() => null);
  const PolarRadiusAxis = _R.PolarRadiusAxis || (() => null);
  const Label       = _R.Label       || (() => null);
  const LabelList   = _R.LabelList   || (() => null);
  const Brush       = _R.Brush       || (() => null);
  const ErrorBar    = _R.ErrorBar    || (() => null);

  // Error Boundary Component
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
      console.error("Preview React Error:", error, errorInfo);
    }
    render() {
      if (this.state.hasError) {
        const errMsg = this.state.error?.message || 'A runtime error occurred in this component.';
        return (
          <div style={{ padding: '24px', color: '#fca5a5', fontFamily: '-apple-system,sans-serif', background: '#16181f', border: '1px solid #ef4444', borderRadius: '12px', margin: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#f87171' }}>⚠️ React Preview Notice</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', lineHeight: '1.5', color: '#e2e4f0' }}>{errMsg}</p>
            <button
              onClick={() => {
                try {
                  window.parent.postMessage({ type: 'PREVIEW_AUTO_FIX_REQUEST', error: errMsg }, '*');
                } catch(e) {
                  console.error("Auto-Fix postMessage failed:", e);
                }
              }}
              style={{
                background: 'linear-gradient(180deg, #818693, #595e69)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🤖 Auto-Fix with AI
            </button>
          </div>
        );
      }
      return this.props.children;
    }
  }

  try {
    ${helperCodes.join("\n\n")}

    ${componentCodes.join("\n\n")}

    // Mount to #root
    let mountTarget = document.getElementById("root");
    if (!mountTarget) {
      mountTarget = document.createElement("div");
      mountTarget.id = "root";
      document.body.prepend(mountTarget);
    }

    const _RootComp = 
      (typeof App !== 'undefined' && App) ||
      (typeof Game !== 'undefined' && Game) ||
      (typeof TicTacToe !== 'undefined' && TicTacToe) ||
      (typeof Main !== 'undefined' && Main) ||
      (typeof Board !== 'undefined' && Board);

    if (_RootComp) {
      const root = ReactDOM.createRoot(mountTarget);
      root.render(
        <ErrorBoundary>
          <_RootComp />
        </ErrorBoundary>
      );
    }

    // Dismiss loading screen if present
    const loader = document.getElementById("loading-screen") || document.querySelector(".loading-screen");
    if (loader) {
      loader.style.display = "none";
      loader.classList.add("hidden");
    }
  } catch (err) {
    console.error("Preview Render Error:", err);
    const target = document.getElementById("root") || document.body;
    if (target) {
      const escapedMsg = JSON.stringify(err.message || String(err));
      target.innerHTML = '<div style="padding:24px;color:#fca5a5;font-family:-apple-system,sans-serif;background:#16181f;border:1px solid #ef4444;border-radius:12px;margin:20px;"><h3 style="margin:0 0 8px 0;color:#f87171;font-size:16px;">Preview Render Note</h3><p style="margin:0 0 16px 0;font-size:13px;color:#e2e4f0;">' + (err.message || String(err)) + '</p><button onclick="window.parent.postMessage({ type: \\'PREVIEW_AUTO_FIX_REQUEST\\', error: ' + escapedMsg + ' }, \\'*\\')" style="background:linear-gradient(180deg,#818693,#595e69);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">🤖 Auto-Fix with AI</button></div>';
    }
  }
</script>
`;

    // Remove any local relative script tags to prevent 404s in blob URL
    html = html.replace(/<script[^>]+src=["'](?:\.?\/?(?:js\/|public\/|src\/)?(?!(?:https?:|\/\/))[^"']+)["'][^>]*>\s*<\/script>/gi, "");

    // Ensure root div exists in body
    if (!html.includes('id="root"')) {
      if (html.includes("<body>")) {
        html = html.replace("<body>", '<body>\n  <div id="root"></div>');
      } else {
        html = `<div id="root"></div>\n${html}`;
      }
    }

    if (html.includes("</body>")) {
      html = html.replace("</body>", `${reactRuntime}\n</body>`);
    } else {
      html = `${html}\n${reactRuntime}`;
    }

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    return URL.createObjectURL(blob);
  }

  // ─── 3. Handling Vanilla HTML / JS Bundling ─────────────────────────────────
  // Remove local script tags from HTML to prevent failed relative network requests in blob iframe
  html = html.replace(/<script[^>]+src=["'](?:\.?\/?(?:js\/|public\/|src\/)?(?!(?:https?:|\/\/))[^"']+\.js)["'][^>]*>\s*<\/script>/gi, "");

  // Identify all client-side JavaScript files
  const isExcludedServer = (k) =>
    k.includes("server.js") ||
    k.includes("routes/") ||
    k.includes("models/") ||
    k.includes("middleware/") ||
    k.includes("controllers/") ||
    k.includes("tests/") ||
    k.includes("vite.config") ||
    k.includes("tailwind.config");

  const clientJsEntries = Object.entries(files).filter(
    ([k]) => k.endsWith(".js") && !isExcludedServer(k)
  );

  // Sort by dependency rank: constants -> utils/helpers -> models/classes -> engine/managers -> app/game entry
  const getScriptRank = (path) => {
    const p = path.toLowerCase();
    if (p.includes("constant") || p.includes("config") || p.includes("type") || p.includes("setting")) return 0;
    if (p.includes("util") || p.includes("helper") || p.includes("storage") || p.includes("data") || p.includes("audio") || p.includes("sound")) return 1;
    if (p.includes("snake") || p.includes("food") || p.includes("board") || p.includes("player") || p.includes("cell") || p.includes("item") || p.includes("card")) return 2;
    if (p.includes("engine") || p.includes("manager") || p.includes("controller") || p.includes("ui") || p.includes("api")) return 3;
    if (p.includes("game") || p.includes("app") || p.includes("main") || p.includes("index") || p.includes("script")) return 4;
    return 2;
  };

  clientJsEntries.sort(([a], [b]) => getScriptRank(a) - getScriptRank(b));

  const bundledScripts = clientJsEntries
    .map(([k, c]) => `// ─── Module: ${k} ───\n${c || ""}`)
    .join("\n\n");

  const clientRuntime = `
<script>
  try {
    ${bundledScripts}

    // Auto-initialize Lucide icons if loaded
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    // Ensure keyboard focus for game canvases
    window.addEventListener('load', () => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.setAttribute('tabindex', '0');
        canvas.focus();
      }
    });

    // Dismiss loading screen if present
    const loader = document.getElementById("loading-screen") || document.querySelector(".loading-screen");
    if (loader) {
      loader.style.display = "none";
      loader.classList.add("hidden");
    }
  } catch (err) {
    console.error("Preview Script Error:", err);
  }
</script>
`;

  if (html.includes("</body>")) {
    html = html.replace("</body>", `${clientRuntime}\n</body>`);
  } else {
    html = `${html}\n${clientRuntime}`;
  }

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  return URL.createObjectURL(blob);
}

export default function PreviewPanel({ result, projectName, onAutoFix }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [isBackend, setIsBackend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [device, setDevice] = useState("desktop");
  const iframeRef = useRef(null);
  const prevUrlRef = useRef(null);

  useEffect(() => {
    function handleMessage(event) {
      if (event.data && event.data.type === "PREVIEW_AUTO_FIX_REQUEST") {
        const error = event.data.error;
        if (typeof onAutoFix === "function" && error) {
          onAutoFix(error);
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onAutoFix]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);

      let files = result?.files;
      const effectiveName = projectName || result?.project_name;

      if ((!files || Object.keys(files).length === 0) && effectiveName) {
        setLoading(true);
        try {
          const data = await getProjectFiles(effectiveName);
          if (!cancelled) files = data.files || {};
        } catch {
          files = {};
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      if (cancelled) return;

      const fileKeys = Object.keys(files || {});
      const hasHtml = fileKeys.some((k) => k.endsWith(".html"));

      if (!hasHtml) {
        setIsBackend(Boolean(effectiveName && fileKeys.length > 0));
        setBlobUrl(null);
        return;
      }

      setIsBackend(false);
      const url = buildBlobUrl(files);
      setBlobUrl(url);
      prevUrlRef.current = url;
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [result, projectName]);

  function reload() {
    if (iframeRef.current && blobUrl) {
      iframeRef.current.src = blobUrl;
    }
  }

  function openNew() {
    if (blobUrl) window.open(blobUrl, "_blank");
  }

  const effectiveName = projectName || result?.project_name;
  const urlLabel = effectiveName ? `preview://${effectiveName}/index.html` : "No project loaded";

  const deviceWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px",
  };

  return (
    <div className="ide-preview">
      <div className="ide-preview__bar">
        <div className="ide-preview__dots">
          <div className="ide-preview__dot" />
          <div className="ide-preview__dot" />
          <div className="ide-preview__dot" />
        </div>

        <div style={{ display: "flex", gap: "2px", background: "var(--ide-surface-2)", padding: "2px", borderRadius: "6px", border: "1px solid var(--ide-border)" }}>
          <button
            type="button"
            className={`ide-icon-btn ${device === "desktop" ? "ide-tree-file--active" : ""}`}
            style={{ width: "24px", height: "22px", fontSize: "11px", border: "none" }}
            onClick={() => setDevice("desktop")}
            title="Desktop view"
          >
            🖥
          </button>
          <button
            type="button"
            className={`ide-icon-btn ${device === "tablet" ? "ide-tree-file--active" : ""}`}
            style={{ width: "24px", height: "22px", fontSize: "11px", border: "none" }}
            onClick={() => setDevice("tablet")}
            title="Tablet view (768px)"
          >
            📱
          </button>
          <button
            type="button"
            className={`ide-icon-btn ${device === "mobile" ? "ide-tree-file--active" : ""}`}
            style={{ width: "24px", height: "22px", fontSize: "11px", border: "none" }}
            onClick={() => setDevice("mobile")}
            title="Mobile view (390px)"
          >
            📲
          </button>
        </div>

        <div className="ide-preview__url">{urlLabel}</div>

        <div className="ide-preview__actions">
          <button className="ide-icon-btn" onClick={reload} title="Reload Preview" type="button">↺</button>
          <button className="ide-icon-btn" onClick={openNew} title="Open in new browser tab" type="button">↗</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", background: "#080a0f", overflow: "hidden", position: "relative" }}>
        {loading ? (
          <div className="ide-preview__empty">
            <div className="ide-preview__empty-icon">⏳</div>
            <div className="ide-preview__empty-title">Loading Preview…</div>
          </div>
        ) : blobUrl ? (
          <iframe
            ref={iframeRef}
            className="ide-preview__frame"
            style={{
              width: deviceWidths[device],
              maxWidth: "100%",
              height: "100%",
              boxShadow: device !== "desktop" ? "0 0 32px rgba(0,0,0,0.8)" : "none",
              border: device !== "desktop" ? "1px solid var(--ide-border)" : "none",
              transition: "width 0.2s ease-in-out",
            }}
            src={blobUrl}
            title="Live Preview"
            sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
          />
        ) : (
          <div className="ide-preview__empty">
            <div className="ide-preview__empty-icon">{isBackend ? "⚙️" : "🌐"}</div>
            <div className="ide-preview__empty-title">
              {isBackend ? "Backend / API Project" : "No Preview Available"}
            </div>
            <div className="ide-preview__empty-sub">
              {isBackend
                ? `This is a server-side project (${result?.tech_stack || "Express/FastAPI"}). Check the Files tab to view routes and server code.`
                : effectiveName
                ? "The project does not contain an index.html file. Check the Files tab."
                : "Generate an app to see the live interactive website render here."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
