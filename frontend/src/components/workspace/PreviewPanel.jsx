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


  // 3. Strip TypeScript-specific syntax that Babel needs 'typescript' preset for
  // Remove standalone interface declarations
  code = code.replace(/^[ \t]*(?:export\s+)?interface\s+\w[\w\s<>,]*\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/gm, '');
  // Remove type alias declarations
  code = code.replace(/^[ \t]*(?:export\s+)?type\s+\w+\s*(?:<[^>]*>)?\s*=[^;]+;?/gm, '');
  // Remove enum declarations (convert to object)
  code = code.replace(/(?:export\s+)?(?:const\s+)?enum\s+(\w+)\s*\{([^}]*)\}/g, function(_, name, body) {
    var entries = body.split(',').map(function(e){var k=(e.split('=')[0]||'').trim();return k?'"'+k+'":\\"'+k+'\\"':''}).filter(Boolean).join(',');
    return 'const '+name+' = {'+entries+'};';
  });
  // Remove TypeScript decorators
  code = code.replace(/^\s*@\w[\w.]*(?:\([^)]*\))?\s*$/gm, '');
  return code;
}

// Names already declared in the JSX runtime block (Recharts, hooks, utilities)
// — must NOT be re-declared as Lucide icon stubs or Babel will error.
const RESERVED_NAMES = new Set([
  // Recharts chart components
  "ResponsiveContainer","AreaChart","LineChart","BarChart","PieChart","ComposedChart",
  "ScatterChart","RadarChart","RadialBarChart","FunnelChart","Treemap","Sankey",
  "Area","Bar","Line","Pie","Scatter","Radar","RadialBar","Funnel","Cell",
  "XAxis","YAxis","ZAxis","CartesianGrid","Tooltip","Legend",
  "ReferenceLine","ReferenceArea","ReferenceDot",
  "PolarGrid","PolarAngleAxis","PolarRadiusAxis","Label","LabelList","Brush","ErrorBar",
  // React hooks (destructured from React)
  "useState","useEffect","useRef","useMemo","useCallback",
  "createContext","useContext","useReducer","useId",
  // Custom utility fallbacks in the JSX block
  "useFavorites","useTheme","useAudio","usePlayer",
  "isFavorite","toggleFavorite","formatTime","formatDuration",
  "ErrorBoundary",
]);
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

  // --- 0. Fallback error catcher for vanilla HTML (non-React) projects -------
  // React projects use __showPreviewError + manual Babel.transform() instead.
  const errorCatcherTag = `
<script>
  window.addEventListener('error', function(e) {
    if (!e.message || e.message === 'Script error.') return;
    if (typeof window.__showPreviewError === 'function') {
      window.__showPreviewError(e.message || String(e.error)); return;
    }
    var root = document.getElementById('root') || document.body;
    if (!root || root.innerHTML.indexOf('Preview Runtime Notice') !== -1) return;
    var msg = e.message || 'A runtime error occurred.';
    var escaped = JSON.stringify(msg);
    var div = document.createElement('div');
    div.style = 'padding:24px;margin:16px;background:#16181f;border:1px solid #ef4444;border-radius:12px;color:#fca5a5;font-family:-apple-system,sans-serif;max-width:680px;';
    div.innerHTML = '<h3 style="color:#f87171;margin:0 0 10px;font-size:15px;">&#9888;&#65039; Preview Runtime Notice</h3><pre style="font-size:12px;color:#e2e4f0;white-space:pre-wrap;background:rgba(255,255,255,0.04);border-radius:6px;padding:10px;margin:0 0 16px;">' + msg.replace(/</g,'&lt;') + '</pre><button onclick="window.parent.postMessage({type:\'PREVIEW_AUTO_FIX_REQUEST\',error:' + escaped + '},\'*\')" style="background:linear-gradient(180deg,#818693,#595e69);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;">&#129302; Auto-Fix with AI</button>';
    root.appendChild(div);
  });
<\/script>
`;
  if (html.includes("<head>")) {
    html = html.replace("<head>", () => `<head>\n${errorCatcherTag}`);
  } else {
    html = `<head>${errorCatcherTag}</head>\n${html}`;
  }
  // ─── 1. Ensure Tailwind CSS & Font CDN in head ───────────────────────────
  if (!html.includes("cdn.tailwindcss.com")) {
    const tailwindTag = '<script src="https://cdn.tailwindcss.com"></script>';
    html = html.replace("</head>", () => `  ${tailwindTag}\n</head>`);
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
    html = html.replace("</head>", () => `${remainingCss}\n</head>`);
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
      .filter((name) => !RESERVED_NAMES.has(name))
      .map((name) => `const ${name} = _icon('${name}');`)
      .join("\n  ");

    // React CDN dependencies – Babel is invoked MANUALLY so real errors surface
    const reactRuntime = `
<!-- React & Babel Standalone CDN -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
<script src="https://unpkg.com/recharts/umd/Recharts.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>

<script>
// ── Shared error UI – same-origin, so real error messages are visible ──
window.__showPreviewError = function(msg) {
  var target = document.getElementById('root') || document.body;
  if (!target) return;
  var escaped = JSON.stringify(String(msg));
  target.innerHTML =
    '<div style="padding:24px;margin:16px;background:#16181f;border:1px solid #ef4444;border-radius:12px;color:#fca5a5;font-family:-apple-system,BlinkMacSystemFont,\\'Segoe UI\\',sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.5);max-width:680px;">' +
    '<h3 style="margin:0 0 10px;color:#f87171;font-size:15px;">\\u26a0\\ufe0f Preview Runtime Notice<\\/h3>' +
    '<pre style="margin:0 0 16px;font-size:12px;line-height:1.6;color:#e2e4f0;white-space:pre-wrap;word-break:break-word;background:rgba(255,255,255,0.04);border-radius:6px;padding:10px;">' + String(msg).replace(/</g,'&lt;').replace(/>/g,'&gt;') + '<\\/pre>' +
    '<button onclick="window.parent.postMessage({type:\\'PREVIEW_AUTO_FIX_REQUEST\\',error:' + escaped + '},\\'*\\')" ' +
    'style="background:linear-gradient(180deg,#818693,#595e69);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;">' +
    '\\ud83e\\udd16 Auto-Fix with AI<\\/button><\\/div>';
};

// ── Run after ALL CDN scripts have loaded ──
window.addEventListener('load', function() {
  try {
    if (typeof Babel === 'undefined') {
      window.__showPreviewError('Babel CDN failed to load. Check your internet connection and refresh.');
      return;
    }
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      window.__showPreviewError('React CDN failed to load. Check your internet connection and refresh.');
      return;
    }

    var src = document.getElementById('__jsx_source__');
    if (!src) { window.__showPreviewError('Internal error: JSX source block missing.'); return; }
    var rawCode = src.textContent;

    // ── Step 1: Babel transform (same-origin → real error messages) ──
    var transformed;
    try {
      transformed = Babel.transform(rawCode, {
        presets: ['typescript', ['react', { runtime: 'classic' }], 'env'],
        filename: 'preview.tsx',
        sourceType: 'module',
      });
    } catch (babelErr) {
      window.__showPreviewError('JSX Compilation Error:\\n' + (babelErr.message || String(babelErr)));
      return;
    }

    // ── Step 2: eval compiled JS (same-origin → real error messages) ──
    try {
      // eslint-disable-next-line no-new-func
      new Function(transformed.code)();
    } catch (evalErr) {
      window.__showPreviewError('Runtime Error:\\n' + (evalErr.stack || evalErr.message || String(evalErr)));
    }
  } catch (outerErr) {
    window.__showPreviewError('Unexpected preview error:\\n' + (outerErr.message || String(outerErr)));
  }
});
<\/script>

<!-- JSX source – type=text/plain so browser never auto-executes it -->
<script type="text/plain" id="__jsx_source__">
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
  const useFavorites = () => ({ favorites: [], isFavorite: () => false, toggleFavorite: () => {}, addFavorite: () => {}, removeFavorite: () => {} });
  const useTheme = () => ({ theme: 'dark', toggleTheme: () => {}, isDark: true });
  const useAudio = () => ({ isPlaying: false, play: () => {}, pause: () => {}, toggle: () => {}, progress: 0, duration: 180, setVolume: () => {} });
  const usePlayer = () => ({ currentTrack: null, isPlaying: false, play: () => {}, pause: () => {}, next: () => {}, prev: () => {} });
  const isFavorite = () => false;
  const toggleFavorite = () => {};
  const formatTime = (secs) => { if (!secs || isNaN(secs)) return "0:00"; const m = Math.floor(secs / 60); const s = Math.floor(secs % 60); return m + ":" + (s < 10 ? "0" : "") + s; };
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
    <div style={{ width: width || '100%', height: typeof height === 'number' ? height : 300, position: 'relative', ...style }}>{children}</div>
  ));
  const AreaChart      = _R.AreaChart      || _chartPlaceholder('📈 Area Chart',     '#818693');
  const LineChart      = _R.LineChart      || _chartPlaceholder('📉 Line Chart',     '#10b981');
  const BarChart       = _R.BarChart       || _chartPlaceholder('📊 Bar Chart',      '#3b82f6');
  const PieChart       = _R.PieChart       || _chartPlaceholder('🥧 Pie Chart',      '#f59e0b');
  const ComposedChart  = _R.ComposedChart  || _chartPlaceholder('📊 Composed Chart', '#8b5cf6');
  const ScatterChart   = _R.ScatterChart   || _chartPlaceholder('🔵 Scatter Chart',  '#06b6d4');
  const RadarChart     = _R.RadarChart     || _chartPlaceholder('🕸 Radar Chart',    '#ec4899');
  const RadialBarChart = _R.RadialBarChart || _chartPlaceholder('🔴 Radial Chart',   '#ef4444');
  const FunnelChart    = _R.FunnelChart    || _chartPlaceholder('🔺 Funnel Chart',   '#f97316');
  const Treemap        = _R.Treemap        || _chartPlaceholder('🗂 Treemap',         '#14b8a6');
  const Sankey         = _R.Sankey         || _chartPlaceholder('〰 Sankey',          '#a78bfa');
  const Area           = _R.Area           || (() => null);
  const Bar            = _R.Bar            || (() => null);
  const Line           = _R.Line           || (() => null);
  const Pie            = _R.Pie            || (() => null);
  const Scatter        = _R.Scatter        || (() => null);
  const Radar          = _R.Radar          || (() => null);
  const RadialBar      = _R.RadialBar      || (() => null);
  const Funnel         = _R.Funnel         || (() => null);
  const Cell           = _R.Cell           || (() => null);
  const XAxis          = _R.XAxis          || (() => null);
  const YAxis          = _R.YAxis          || (() => null);
  const ZAxis          = _R.ZAxis          || (() => null);
  const CartesianGrid  = _R.CartesianGrid  || (() => null);
  const Tooltip        = _R.Tooltip        || (() => null);
  const Legend         = _R.Legend         || (() => null);
  const ReferenceLine  = _R.ReferenceLine  || (() => null);
  const ReferenceArea  = _R.ReferenceArea  || (() => null);
  const ReferenceDot   = _R.ReferenceDot   || (() => null);
  const PolarGrid         = _R.PolarGrid         || (() => null);
  const PolarAngleAxis    = _R.PolarAngleAxis    || (() => null);
  const PolarRadiusAxis   = _R.PolarRadiusAxis   || (() => null);
  const Label             = _R.Label             || (() => null);
  const LabelList         = _R.LabelList         || (() => null);
  const Brush             = _R.Brush             || (() => null);
  const ErrorBar          = _R.ErrorBar          || (() => null);

  // Error Boundary Component
  class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, info) { console.error("Preview React Error:", error, info); }
    render() {
      if (this.state.hasError) {
        const errMsg = this.state.error?.message || 'A runtime error occurred in this component.';
        return (
          <div style={{ padding: '24px', color: '#fca5a5', fontFamily: '-apple-system,sans-serif', background: '#16181f', border: '1px solid #ef4444', borderRadius: '12px', margin: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#f87171' }}>⚠️ React Preview Notice</h3>
            <pre style={{ margin: '0 0 16px', fontSize: '12px', lineHeight: '1.6', color: '#e2e4f0', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '10px' }}>{errMsg}</pre>
            <button
              onClick={() => { try { window.parent.postMessage({ type: 'PREVIEW_AUTO_FIX_REQUEST', error: errMsg }, '*'); } catch(e) {} }}
              style={{ background: 'linear-gradient(180deg,#818693,#595e69)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >🤖 Auto-Fix with AI</button>
          </div>
        );
      }
      return this.props.children;
    }
  }

  ${helperCodes.join("\n\n")}

  ${componentCodes.join("\n\n")}

  // Mount to #root
  let mountTarget = document.getElementById('root');
  if (!mountTarget) { mountTarget = document.createElement('div'); mountTarget.id = 'root'; document.body.prepend(mountTarget); }

  const _RootComp =
    (typeof App          !== 'undefined' && App)          ||
    (typeof Game         !== 'undefined' && Game)         ||
    (typeof TicTacToe    !== 'undefined' && TicTacToe)    ||
    (typeof Main         !== 'undefined' && Main)         ||
    (typeof Board        !== 'undefined' && Board)        ||
    (typeof Dashboard    !== 'undefined' && Dashboard)    ||
    (typeof HomePage     !== 'undefined' && HomePage)     ||
    (typeof LandingPage  !== 'undefined' && LandingPage)  ||
    (typeof Index        !== 'undefined' && Index);

  if (_RootComp) {
    const _reactRoot = ReactDOM.createRoot(mountTarget);
    _reactRoot.render(<ErrorBoundary><_RootComp /></ErrorBoundary>);
  } else {
    window.__showPreviewError('No root component found.\nExpected one of: App, Game, TicTacToe, Main, Board, Dashboard, HomePage, LandingPage');
  }

  // Dismiss loading screen if present
  const loader = document.getElementById('loading-screen') || document.querySelector('.loading-screen');
  if (loader) { loader.style.display = 'none'; loader.classList.add('hidden'); }
<\/script>
`

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
      html = html.replace("</body>", () => `${reactRuntime}\n</body>`);
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
    html = html.replace("</body>", () => `${clientRuntime}\n</body>`);
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
  const [autoFixing, setAutoFixing] = useState(false);
  const [device, setDevice] = useState("desktop");
  const iframeRef = useRef(null);
  const prevUrlRef = useRef(null);
  // Keep a stable ref to onAutoFix so the message handler never goes stale
  const onAutoFixRef = useRef(onAutoFix);
  useEffect(() => { onAutoFixRef.current = onAutoFix; }, [onAutoFix]);

  useEffect(() => {
    async function handleMessage(event) {
      if (event.data && event.data.type === "PREVIEW_AUTO_FIX_REQUEST") {
        const error = event.data.error;
        if (typeof onAutoFixRef.current === "function" && error) {
          setAutoFixing(true);
          try {
            await onAutoFixRef.current(error);
          } catch (err) {
            console.error("Auto-Fix failed:", err);
          } finally {
            setAutoFixing(false);
          }
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []); // stable — uses ref

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

      {/* Auto-Fix in-progress banner */}
      {autoFixing && (
        <div style={{
          padding: "8px 14px",
          background: "linear-gradient(90deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))",
          borderBottom: "1px solid rgba(99,102,241,0.4)",
          color: "#c4b5fd",
          fontSize: "12px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}>
          <span style={{
            display: "inline-block",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            border: "2px solid #818cf8",
            borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite",
          }} />
          🤖 Auto-Fix with AI running — analyzing error and patching project files…
        </div>
      )}

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
              transition: "width 0.2s ease-in-out, opacity 0.3s ease",
              opacity: autoFixing ? 0.4 : 1,
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
