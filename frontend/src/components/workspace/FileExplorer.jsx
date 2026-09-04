import { useEffect, useState } from "react";
import { getProjectFiles } from "../../services/api";

const FILE_ICONS = {
  js: "📜", jsx: "⚛️", ts: "📘", tsx: "⚛️", html: "🌐", css: "🎨",
  py: "🐍", json: "📋", md: "📄", txt: "📄", sh: "⚙️",
};

function getIcon(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return FILE_ICONS[ext] || "📄";
}

function buildTree(files) {
  const tree = {};
  for (const path of files) {
    const parts = path.split("/");
    if (parts.length === 1) {
      if (!tree.__root__) tree.__root__ = [];
      tree.__root__.push(path);
    } else {
      const folder = parts[0];
      if (!tree[folder]) tree[folder] = [];
      tree[folder].push(path);
    }
  }
  return tree;
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

export default function FileExplorer({ result, projectName }) {
  const [files, setFiles] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!projectName) { setFiles({}); setSelectedFile(null); return; }

    // Use files from result if available
    if (result?.files && Object.keys(result.files).length > 0) {
      setFiles(result.files);
      const firstHtml = Object.keys(result.files).find((k) => k.endsWith(".html"));
      const firstFile = firstHtml || Object.keys(result.files)[0];
      setSelectedFile(firstFile || null);
      return;
    }

    // Otherwise fetch from API
    setLoading(true);
    getProjectFiles(projectName)
      .then((data) => {
        setFiles(data.files || {});
        const keys = Object.keys(data.files || {});
        setSelectedFile(keys[0] || null);
      })
      .catch(() => setFiles({}))
      .finally(() => setLoading(false));
  }, [projectName, result]);

  const fileList = Object.keys(files).sort();
  const tree = buildTree(fileList);
  const selectedContent = selectedFile ? files[selectedFile] : null;

  function handleCopy() {
    if (selectedContent) {
      copyToClipboard(selectedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!projectName && fileList.length === 0) {
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
        <div className="ide-file-tree__header">{projectName || "Files"}</div>
        {loading && <div style={{ padding: "8px 14px", fontSize: "11px", color: "var(--ide-text-muted)" }}>Loading…</div>}
        {/* Root files */}
        {tree.__root__?.map((f) => (
          <div
            key={f}
            className={`ide-tree-file ${selectedFile === f ? "ide-tree-file--active" : ""}`}
            onClick={() => setSelectedFile(f)}
            style={{ paddingLeft: "14px" }}
          >
            {getIcon(f)} {f}
          </div>
        ))}
        {/* Folders */}
        {Object.entries(tree)
          .filter(([k]) => k !== "__root__")
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([folder, folderFiles]) => (
            <div key={folder}>
              <div className="ide-tree-folder">📂 {folder}/</div>
              {folderFiles.map((f) => (
                <div
                  key={f}
                  className={`ide-tree-file ${selectedFile === f ? "ide-tree-file--active" : ""}`}
                  onClick={() => setSelectedFile(f)}
                >
                  {getIcon(f)} {f.split("/").pop()}
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* Code Viewer */}
      <div className="ide-code-viewer">
        {selectedFile ? (
          <>
            <div className="ide-code-viewer__header">
              <span className="ide-code-viewer__filename">{getIcon(selectedFile)} {selectedFile}</span>
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
