import { useState, useEffect } from "react"

function IndexPopup() {
  const [processName, setProcessName] = useState("")
  const [status, setStatus] = useState("Not connected")
  const [backendUrl, setBackendUrl] = useState("http://127.0.0.1:5000/flask")

  useEffect(() => {
    // Check if backend is available
    fetch(backendUrl + "/status")
      .then(res => {
        if (res.ok) {
          setStatus("Connected")
        } else {
          setStatus("Error connecting to backend")
        }
      })
      .catch(() => {
        setStatus("Backend not available")
      })
  }, [backendUrl])

  const testConnection = () => {
    fetch(backendUrl + "/status")
      .then(res => {
        if (res.ok) {
          setStatus("Connected")
          alert("Backend connection successful!")
        } else {
          setStatus("Error connecting to backend")
          alert("Backend returned error status")
        }
      })
      .catch(err => {
        setStatus("Backend not available")
        alert("Cannot connect to backend: " + err.message)
      })
  }

  return (
    <div style={{ padding: 16, width: 300 }}>
      <h2>SIG-Áreas Helper</h2>
      
      <div style={{ marginBottom: 16 }}>
        <h3>Backend status: <span style={{ 
          color: status === "Connected" ? "green" : "red" 
        }}>{status}</span></h3>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <label>
          Backend URL:
          <input 
            style={{ width: "100%", marginTop: 4 }}
            type="text" 
            value={backendUrl} 
            onChange={(e) => setBackendUrl(e.target.value)}
          />
        </label>
      </div>
      
      <button 
        style={{ marginBottom: 16 }}
        onClick={testConnection}>
        Test Connection
      </button>
      
      <div>
        <p>
          Use this extension to assist with SIG-Áreas tasks. The extension 
          will automatically inject helper functionality when you browse 
          to the SIG-Áreas system.
        </p>
        <p>
          <strong>Controls:</strong>
          <ul>
            <li>Press <kbd>Enter</kbd> to refresh checkbox priorities</li>
            <li>Press <kbd>r</kbd> to mark study as finished</li>
          </ul>
        </p>
      </div>
    </div>
  )
}

export default IndexPopup