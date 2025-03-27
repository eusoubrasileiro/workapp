import { useEffect } from "react"
import type { PlasmoCSConfig } from "plasmo"
 
export const config: PlasmoCSConfig = {
  matches: ["https://app.anm.gov.br/sigareas"],
  all_frames: true
}
// Constants
const BACKEND_URL = 'http://127.0.0.1:5000/flask'
const SLEEP = 400 // sleep between clicks
let checkedDict = {} // Dictionary of processes marked in database
let studyFinished = false
let processName = ''

// Main content script component
const SigAreasHelper = () => {
  useEffect(() => {
    initialize()
  }, [])

  const initialize = async () => {
    console.log("SIG-Áreas Helper initialized")
    
    // Add header/navigation bar
    addNavigationBar()
    
    // Check if we're on a valid study page
    const estudosValidos = ['1', '8', '21']
    const isValidStudy = checkIfValidStudy(estudosValidos)
    
    if (isValidStudy) {
      processName = getMainProcess()
      document.title = `SIG-Áreas[${processName}]`

      // Set up checkbox tracking
      setupCheckboxTracking()
      
      // Load checkbox priorities
      highlightSetCheckboxesPrioridade()

      // Set up keyboard shortcuts
      setupKeyboardShortcuts()
      
      // Set up study completion tracking
      setupStudyCompletionTracking()
    }
  }

  return null
}

// Helper functions (port your existing ones)
function addNavigationBar() {
  const headerHtml = `
    <div class="navbarcontainer">        
      <div class="navbar">
          <div class="h1">Workapp<div>
          <div class="h1" id="workapp-process-name"> </div>
          <div class="h2">checked 
            <span id="count-checked-checkboxes">0</span>/
            <span id="count-checkboxes">0</span> 
          </div>        
          <div class="h2"> <span id="workapp-finished-study"></span>
          </div>
      </div>
    </div>
  `
  document.querySelector("body")?.insertAdjacentHTML("afterbegin", headerHtml)
}

function getMainProcess() {
  // Update this selector to match the new interface
  try {
    return document.querySelector("YOUR_NEW_SELECTOR_HERE")?.textContent || ''
  } catch {
    return ''
  }
}

// Port your other functions here...

function highlightSetCheckboxesPrioridade() {
  console.log(`Process in analysis is ${processName}`)
  processName = getMainProcess()
  document.title = 'SIG-Áreas['+processName+']'
  
  // Update this to use fetch API
  fetch(`${BACKEND_URL}/get_prioridade?process=${processName}`)
    .then(res => res.json()
    .then(data => { 
      checkedDict = data
      let sleepTime = SLEEP // start 
      
      if (Object.keys(checkedDict).length === 0) {
        console.warn('No checkbox data. No table?')
      } else {
        // Update these selectors to match the new interface
        document.querySelectorAll("YOUR_NEW_CHECKBOX_SELECTOR").forEach((element, i) => {
          // Your checkbox handling logic
          // ...
        })
      }
    }))
    .catch((error) => {
      alert(`Error in helper applet: ${error}`)
    })
}

// Add more of your ported functions here...

export default SigAreasHelper