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
    const { name: procId } = useParams();          
    const [files, setFiles] = useState([]);      // directory listing
    const [selected, setSelected] = useState();   // currently previewed file (object from list)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    const apiBase = `/flask/process/${fmtProcessName(procId)}/files`;
  
    // Build raw‑file URL while keeping nested paths intact
    const urlFor = useCallback(
      (rel) => `${apiBase}/${rel.split("/").map(encodeURIComponent).join("/")}`,
      [apiBase]
    );
  
    // Fetch listing on mount / procId change
    useEffect(() => {
      let cancel = false;
      setLoading(true);
      setError(null);
  
      fetch(apiBase)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((json) => {
          if (!cancel) {
            setFiles(json.filter(f => f.path.endsWith(".png") || f.path.endsWith(".pdf")));
            const selected = json.filter(f => f.path.includes("backend_png"));            
            setSelected(selected ? selected[0] : undefined);
          }
        })
        .catch((err) => !cancel && setError(err))
        .finally(() => !cancel && setLoading(false));
  
      return () => {
        cancel = true;
      };
    }, [apiBase]);

    // Decide how to preview based on file extension
    const Preview = () => {
      if (!selected) return <p>Select a file to preview.</p>;  
      const path = selected.path;
  
      if (path.endsWith(".png")) {
        return (
          <img
            src={`data:image/png;base64,${selected.content}`}
            alt={selected.path}
            style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
          />
        );
      }
  
      if (path.endsWith(".pdf")) {
        return (
            <iframe
            src={`data:application/pdf;base64,${selected.content}`}
            title={selected.path}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
          );
      }
  
      return (
        <p>
          Preview not supported. <a href={urlFor(selected.path)} target="_blank" rel="noopener noreferrer">Download</a>
        </p>
      );
    };
  
    // ─────────────────────────────────────────────────────────────────────
    if (loading) return <p style={{ padding: "1rem" }}>Loading …</p>;
    if (error)   return <p style={{ padding: "1rem", color: "red" }}>Error: {error.message}</p>;
    if (!files.length) return <p style={{ padding: "1rem" }}>No .png or .pdf files for this process.</p>;
  
    const fileEntries = files.filter((f) => !f.is_dir).sort((a, b) => a.path.localeCompare(b.path));
  
    return (
      <>        
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1rem", padding: "1rem" }}>
          {/* left – file list */}
          <div>
            <h3 style={{ marginBottom: ".5rem" }}>Files of {procId}</h3>
            <ul style={{ listStyle: "none", padding: 0, maxHeight: "80vh", overflowY: "auto" }}>
              {fileEntries.map((file) => (
                <li key={file.path} style={{ margin: "0.25rem 0" }}>
                  <button
                    onClick={() => setSelected(file)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: selected?.path === file.path ? "#d33" : "#06c",
                      textDecoration: "underline",
                      font: "inherit",
                    }}
                  >
                    {file.path}
                  </button>
                </li>
              ))}
            </ul>
          </div>
  
          {/* right – preview pane */}
          <div style={{ borderLeft: "1px solid #ccc", paddingLeft: "1rem", height: "100vh", overflow: "auto" }}>
            <Preview />
          </div>
        </div>
      </>
    );
  }

export default FilesViewer;