import { useEffect, useRef, useState } from "react";
import { getProjectFiles } from "../../services/api";

function buildBlobUrl(files) {
  if (!files || typeof files !== "object") return null;

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

  // ─── 1. Inlining All CSS ───────────────────────────────────────────────────
  const cssMatches = [...html.matchAll(/<link[^>]+href=["']([^"']*\.css)["'][^>]*>/gi)];
  const inlinedCss = new Set();

  for (const match of cssMatches) {
    const rawHref = match[1];
    const cleanPath = rawHref.replace(/^\.\//, "").replace(/^\//, "");
    const cssContent =
      files[cleanPath] ||
      files[`src/${cleanPath}`] ||
      files[`public/${cleanPath}`] ||
      Object.entries(files).find(([k]) => k.endsWith(`/${cleanPath}`) || k === cleanPath)?.[1];

    if (cssContent) {
      html = html.replace(match[0], `<style>\n/* Inlined: ${cleanPath} */\n${cssContent}\n</style>`);
      inlinedCss.add(cleanPath);
    }
  }

  // Inject any standalone CSS
  const remainingCss = Object.entries(files)
    .filter(([k]) => k.endsWith(".css") && !inlinedCss.has(k))
    .map(([k, c]) => `<style>\n/* Auto-injected: ${k} */\n${c}\n</style>`)
    .join("\n");

  if (remainingCss) {
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${remainingCss}\n</head>`);
    } else {
      html = `<head>${remainingCss}</head>\n${html}`;
    }
  }

  // ─── 2. Handling React / JSX Bundling ──────────────────────────────────────
  if (isReact) {
    // Collect all JSX & component code
    const componentCodes = [];
    const helperOrder = ["Header", "Navbar", "Sidebar", "Footer", "Card", "Button", "Modal"];

    // Sort components before App.jsx so dependencies are defined first
    const sortedJsxKeys = [...jsxFiles].sort((a, b) => {
      if (a.includes("App.jsx")) return 1;
      if (b.includes("App.jsx")) return -1;
      if (a.includes("main.jsx") || a.includes("index.jsx")) return 1;
      if (b.includes("main.jsx") || b.includes("index.jsx")) return -1;
      return a.localeCompare(b);
    });

    for (const key of sortedJsxKeys) {
      let code = files[key] || "";
      if (!code.trim() || key.includes("main.jsx") || key.includes("index.jsx")) continue;

      // Clean imports & exports for in-browser standalone execution
      code = code
        .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
        .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, "function $1")
        .replace(/export\s+default\s+([A-Za-z0-9_]+);?/g, "")
        .replace(/export\s+\{[^}]*\};?/g, "")
        .replace(/export\s+(const|let|var|function|class)\s+/g, "$1 ");

      componentCodes.push(`// --- Component: ${key} ---\n${code}`);
    }

    // React CDN dependencies + Babel standalone wrapper
    const reactRuntime = `
<!-- React & Babel Standalone CDN -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script type="text/babel" data-presets="react">
  const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

  // Mock react-chartjs-2 fallbacks if imported
  const Bar = (props) => <div className="mock-chart bar-chart" style={{padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center'}}>📊 Bar Chart: {props.data?.datasets?.[0]?.label || 'Data'}</div>;
  const Line = (props) => <div className="mock-chart line-chart" style={{padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center'}}>📈 Line Chart: {props.data?.datasets?.[0]?.label || 'Trend'}</div>;
  const Pie = (props) => <div className="mock-chart pie-chart" style={{padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center'}}>🥧 Pie Chart: {props.data?.labels?.join(', ') || 'Distribution'}</div>;
  const ChartJS = { register: () => {} };
  const CategoryScale = {}; const LinearScale = {}; const BarElement = {}; const PointElement = {}; const LineElement = {}; const ArcElement = {}; const Title = {}; const Tooltip = {}; const Legend = {};

  try {
    ${componentCodes.join("\n\n")}

    // Mount to #root
    const mountTarget = document.getElementById("root");
    if (mountTarget && typeof App !== 'undefined') {
      const root = ReactDOM.createRoot(mountTarget);
      root.render(<App />);
    }

    // Dismiss loading screen if present
    const loader = document.getElementById("loading-screen") || document.querySelector(".loading-screen");
    if (loader) {
      loader.style.display = "none";
      loader.classList.add("hidden");
    }
  } catch (err) {
    console.error("Preview Render Error:", err);
    const target = document.getElementById("root");
    if (target) {
      target.innerHTML = '<div style="padding:24px;color:#f87171;font-family:sans-serif;"><h3>Preview Warning</h3><p>' + err.message + '</p></div>';
    }
  }
</script>
`;

    // Remove any original main.jsx scripts
    html = html.replace(/<script[^>]+src=["'][^"']*(?:main|index)\.jsx?["'][^>]*>\s*<\/script>/gi, "");

    if (html.includes("</body>")) {
      html = html.replace("</body>", `${reactRuntime}\n</body>`);
    } else {
      html = `${html}\n${reactRuntime}`;
    }

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    return URL.createObjectURL(blob);
  }

  // ─── 3. Handling Vanilla HTML / JS Bundling ─────────────────────────────────
  const jsMatches = [...html.matchAll(/<script[^>]+src=["']([^"']*\.js)["'][^>]*>\s*<\/script>/gi)];
  const inlinedJs = new Set();

  for (const match of jsMatches) {
    const rawSrc = match[1];
    const cleanPath = rawSrc.replace(/^\.\//, "").replace(/^\//, "");
    const jsContent =
      files[cleanPath] ||
      files[`public/${cleanPath}`] ||
      files[`src/${cleanPath}`] ||
      Object.entries(files).find(([k]) => k.endsWith(`/${cleanPath}`) || k === cleanPath)?.[1];

    if (jsContent) {
      html = html.replace(match[0], `<script>\n/* Inlined: ${cleanPath} */\n${jsContent}\n</script>`);
      inlinedJs.add(cleanPath);
    }
  }

  // Inject standalone client JS (excluding server/test/config files)
  const isClientJs = (k) =>
    k.endsWith(".js") &&
    !k.includes("server") &&
    !k.includes("test") &&
    !k.includes("routes/") &&
    !k.includes("models/") &&
    !k.includes("vite.config") &&
    !inlinedJs.has(k);

  const remainingJs = Object.entries(files)
    .filter(([k]) => isClientJs(k))
    .map(([k, c]) => `<script>\n/* Auto-injected: ${k} */\n${c}\n</script>`)
    .join("\n");

  const loaderDismissScript = `
<script>
  window.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById("loading-screen") || document.querySelector(".loading-screen");
    if (loader) {
      loader.style.display = "none";
      loader.classList.add("hidden");
    }
  });
</script>
`;

  if (remainingJs || loaderDismissScript) {
    const injection = `${remainingJs}\n${loaderDismissScript}`;
    if (html.includes("</body>")) {
      html = html.replace("</body>", `${injection}\n</body>`);
    } else {
      html = `${html}\n${injection}`;
    }
  }

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  return URL.createObjectURL(blob);
}

export default function PreviewPanel({ result, projectName }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [isBackend, setIsBackend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [device, setDevice] = useState("desktop");
  const iframeRef = useRef(null);
  const prevUrlRef = useRef(null);

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
