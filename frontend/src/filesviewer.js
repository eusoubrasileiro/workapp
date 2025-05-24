import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fmtProcessName } from './utils';
/**
 * <FilesViewer />
 * Shows the list of files that belong to a single process (folder)
 * and opens any file in a new browser tab when the user clicks it.
 *
 * Expected backend endpoints (see Flask sample):
 *   GET /api/process/<proc_id>/files               → JSON array
 *   GET /api/process/<proc_id>/files/<path:file>   → raw bytes
 */

function FilesViewer() {
  const { name: procId } = useParams();                  // process identifier
  const [files, setFiles] = useState([]);                // JSON list from server
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base part of every API call for this process
  const apiBase = `/flask/process/${fmtProcessName(procId)}/files`;

  /**
   * Utility – encode each path segment so "/" keeps its meaning
   *   "sub/dir/foo.pdf" → "sub/dir/foo.pdf" (segments encoded individually)
   */
  const urlFor = useCallback(
    (relPath) =>
      `${apiBase}/${relPath
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
    [apiBase]
  );

  // ───────────────────────────────────────────────────────────────
  // Fetch the directory listing whenever procId changes
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetch(apiBase)
      .then((res) => {
        if (!res.ok) throw new Error(`server responded ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancel) setFiles(json);
      })
      .catch((err) => {
        if (!cancel) setError(err);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [apiBase]);

  // ───────────────────────────────────────────────────────────────
  // Open a file in a new tab (or use a modal / viewer later)
  // ───────────────────────────────────────────────────────────────
  const openFile = useCallback(
    (relPath) => {
      window.location.href = urlFor(relPath);
    },
    [urlFor]
  );

  // ───────────────────────────────────────────────────────────────
  // Render logic
  // ───────────────────────────────────────────────────────────────
  if (loading) return <p style={{ padding: "1rem" }}>Loading …</p>;
  if (error)   return <p style={{ padding: "1rem", color: "red" }}>Error: {error.message}</p>;
  if (!files.length) return <p style={{ padding: "1rem" }}>No files for this process.</p>;

  // separate files and directories; show files first by default
  const filesOnly = files.filter((f) => !f.is_dir).sort((a, b) => a.path.localeCompare(b.path));
  const dirsOnly  = files.filter((f) =>  f.is_dir).sort((a, b) => a.path.localeCompare(b.path));

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>Files for process {procId}</h2>

      {dirsOnly.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: ".5rem" }}>Folders</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {dirsOnly.map((dir) => (
              <li key={dir.path}>{dir.path}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 style={{ fontSize: "1rem", marginBottom: ".5rem" }}>Files</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filesOnly.map((file) => (
            <li key={file.path} style={{ margin: "0.25rem 0" }}>
              <button
                onClick={() => openFile(file.path)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0066cc",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  font: "inherit",
                }}
              >
                {file.path}
              </button>
              <span style={{ marginLeft: "0.5rem", fontSize: "0.8em", color: "#666" }}>
                {Math.round(file.size / 1024)} kB
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default FilesViewer;