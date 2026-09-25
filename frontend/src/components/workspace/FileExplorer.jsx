import { useEffect, useState } from "react";
import { getProjectFiles } from "../../services/api";

const FILE_ICONS = {
  js: "📜",
  jsx: "⚛️",
  ts: "📘",
  tsx: "⚛️",
  html: "🌐",
  css: "🎨",
  py: "🐍",
  json: "📋",
  md: "📄",
  txt: "📄",
  sh: "⚙️",
};

function getIcon(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return FILE_ICONS[ext] || "📄";
}

function buildFileTree(filePaths) {
  const root = { name: "", type: "folder", children: {}, path: "" };

  for (const filePath of filePaths) {
    const parts = filePath.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      if (isFile) {
        current.children[part] = {
          name: part,
          type: "file",
          path: currentPath,
        };
      } else {
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            type: "folder",
            path: currentPath,
            children: {},
          };
        }
        current = current.children[part];
      }
    }
  }

  return root;
}

function TreeNode({ node, selectedFile, onSelectFile, depth = 0 }) {
  const [isOpen, setIsOpen] = useState(true);

  if (node.type === "file") {
    const isSelected = selectedFile === node.path;
    return (
      <div
        className={`ide-tree-file ${isSelected ? "ide-tree-file--active" : ""}`}
        onClick={() => onSelectFile(node.path)}
        style={{ paddingLeft: `${14 + depth * 12}px` }}
        title={node.path}
      >
        <span style={{ marginRight: "4px" }}>{getIcon(node.name)}</span>
        <span>{node.name}</span>
      </div>
    );
  }

  // Folder
  const childNodes = Object.values(node.children || {}).sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      {node.name && (
        <div
          className="ide-tree-folder"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{ paddingLeft: `${14 + depth * 12}px`, cursor: "pointer", userSelect: "none" }}
          title={node.path}
        >
          <span style={{ marginRight: "4px" }}>{isOpen ? "📂" : "📁"}</span>
          <span style={{ fontWeight: 600 }}>{node.name}/</span>
        </div>
      )}
      {isOpen &&
        childNodes.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
            depth={node.name ? depth + 1 : depth}
          />
        ))}
    </div>
  );
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

export default function FileExplorer({ result, projectName }) {
  const [files, setFiles] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const effectiveProjectName = projectName || result?.project_name || result?.projectName;

  useEffect(() => {
    let cancelled = false;

    // 1. Use files directly from result if available
    if (result?.files && Object.keys(result.files).length > 0) {
      setFiles(result.files);
      const keys = Object.keys(result.files);
      const firstHtml = keys.find((k) => k.endsWith(".html"));
      setSelectedFile((prev) => (prev && keys.includes(prev) ? prev : firstHtml || keys[0] || null));
      return;
    }

    // 2. If an effective project name is known, fetch files from API
    if (effectiveProjectName) {
      setLoading(true);
      getProjectFiles(effectiveProjectName)
        .then((data) => {
          if (cancelled) return;
          const loadedFiles = data.files || {};
          setFiles(loadedFiles);
          const keys = Object.keys(loadedFiles);
          const firstHtml = keys.find((k) => k.endsWith(".html"));
          setSelectedFile((prev) => (prev && keys.includes(prev) ? prev : firstHtml || keys[0] || null));
        })
        .catch(() => {
          if (cancelled) return;
          setFiles({});
          setSelectedFile(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return;
    }

    setFiles({});
    setSelectedFile(null);

    return () => {
      cancelled = true;
    };
  }, [effectiveProjectName, result]);

  const fileList = Object.keys(files).sort();
  const tree = buildFileTree(fileList);
  const selectedContent = selectedFile ? files[selectedFile] : null;

  function handleCopy() {
    if (selectedContent) {
      copyToClipboard(selectedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!effectiveProjectName && fileList.length === 0) {
    return (
      <div className="ide-files">
        <div className="ide-empty" style={{ width: "100%" }}>
          <div className="ide-empty__icon">📁</div>
          <div className="ide-empty__title">No Project Open</div>
          <div className="ide-empty__sub">Generate a project to explore its files here.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ide-files">
      {/* File Tree */}
      <div className="ide-file-tree ide-scroll">
        <div className="ide-file-tree__header">{effectiveProjectName || "Files"}</div>
        {loading && (
          <div style={{ padding: "8px 14px", fontSize: "11px", color: "var(--ide-text-muted)" }}>
            Loading…
          </div>
        )}
        <TreeNode
          node={tree}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          depth={0}
        />
      </div>

      {/* Code Viewer */}
      <div className="ide-code-viewer">
        {selectedFile ? (
          <>
            <div className="ide-code-viewer__header">
              <span className="ide-code-viewer__filename">
                {getIcon(selectedFile)} {selectedFile}
              </span>
              <button className="ide-btn ide-btn--ghost ide-btn--sm" onClick={handleCopy} type="button">
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <div className="ide-code-viewer__content ide-scroll">
              <pre className="ide-code-viewer__pre">{selectedContent || "(empty file)"}</pre>
            </div>
          </>
        ) : (
          <div className="ide-code-viewer__empty">
            <div>Select a file from the tree to view its contents</div>
          </div>
        )}
      </div>
    </div>
  );
}
