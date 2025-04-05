import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
// data-text: is a tool to load css files as a string
import styleText from "data-text:contents/style.css"
import { useState, useEffect } from "react"

export const config: PlasmoCSConfig = {
  matches: [ "https://app.anm.gov.br/sigareas/*" ],  
  all_frames: true
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}



function fmtProcessName(name: string){
  const match = name.match(/(\d{6}\/\d{4})/);
  if (match) {
    return match[1];
  }
  return name;
}

async function fetchCheckedProcesses(processName: string): Promise<any>{
  const backendUrl = "http://127.0.0.1:5000/flask"  
  const response = await fetch(`${backendUrl}/get_prioridade?process=${processName}`)
  const data = await response.json()
  return data;
}



function Navbar({checked, total, isReady, processName}: 
  {checked: number, total: number, isReady: boolean, processName: string}) {
 
  let style = {backgroundColor: 'cornflowerblue'};
  if (!isReady) style = {backgroundColor: 'gray'};

  return (
    <div id="navbar-plasmo" style={style}>        
      <div className="navbar">
        <div className="h1">Workapp</div>
        <div className="h1" id="workapp-process-name">{processName}</div>
        <div className="h2">
          checked  
          <span id="count-checked-checkboxes">{checked}</span>/
          <span id="count-checkboxes">{total}</span> 
        </div>        
        <div className="h2">
          <span id="workapp-finished-study"></span>
        </div>
      </div>
    </div>
  );
}

function getProcesses() : {processNumber: string, checkbox: HTMLInputElement}[] {
  if (!document) return []
  
  const tables = document.querySelectorAll("div.ant-table-content table")
  if (!tables || tables.length < 2) return []
  
  const table = tables[1]
  if (!table) return []
  
  const rows = table.querySelectorAll("tr[data-row-key]")
  if (!rows || rows.length === 0) return []
  
  // Map them into objects with checkbox + process number
  const processes = Array.from(rows).map(row => {
    const checkbox = row.querySelector("input[type='checkbox']")
    const span = row.querySelector("td:nth-child(2) span") // the process number
    const processNumber = span.textContent.trim() || ''
    return {            
      processNumber: processNumber as string,
      checkbox: checkbox as HTMLInputElement
    }    
  })

  return processes;
}

function uncheckProcesses(uiProcesses, bckProcesses){
  let sleep_between_clicks = 400; // start 
  if(uiProcesses.length === 0 )
    console.warn('No processes. No table!');
  else{
    // for each process in the table
    uiProcesses.forEach(uiprocess => {
      // change style to mark it was analyzed
      uiprocess.checkbox.style.color = 'blue';
      uiprocess.checkbox.style.fontStyle = 'oblique';
      if (bckProcesses[fmtProcessName(uiprocess.processNumber)] == false 
        && uiprocess.checkbox.checked){        
        let style = uiprocess.checkbox.style;
        style.color = 'red';
        style.fontWeight = 'bolder';
        style.fontStyle = 'normal';
        setTimeout(() => {
          uiprocess.checkbox.click();
        }, sleep_between_clicks);        
      }
    });
  }
}

function SigAreasHelper() {
  const [page, setPage] = useState('');
  const [processName, setProcessName] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [countChecked, setCountChecked] = useState(0);
  const [countTotal, setCountTotal] = useState(0);


  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      console.log("Enter pressed – reinitializing...")
      updateEverything()  // your function to refresh counts, processes, etc.
    }
  }

  // This function checks the page periodically and updates data when it's ready
  const startMonitoring = () => {
    // Non-blocking monitoring loop using requestAnimationFrame
    console.log("Starting monitoring");
    const checkPageState = () => {
      const currentUrl = window.location.href;
      
      if (currentUrl.includes('retirada-interferencia/edit')) {
        setPage('retirada-interferencia');
        // Check if page has loaded enough to extract data
        const canvas = document.querySelector("div canvas");
        const spinner = document.querySelector("div.ant-spin-spinning[aria-busy='true']");
        
        if (canvas && !spinner) {
          if (!isReady) setIsReady(true);
          updateEverything();
        }
      } 
      else {
        // On main page
        if (page !== 'main') {
          setPage('main');
          setIsReady(false);
          updateEverything();
        }
      }            
      // Continue monitoring
      setTimeout(checkPageState, 1000);
    };
    
    // Start the monitoring loop
    setTimeout(checkPageState, 1000);
  };

  useEffect(() => {
    // Start monitoring page state immediately
    startMonitoring();
    
    // Add listener for manual refresh with Enter key
    window.addEventListener("keydown", handleKeyDown);
    
  }, []);

  const updateEverything = async () => {
    
    let processName = '';

    if (document) {
      let table = document.querySelector('tr[data-row-key="1"] td:nth-child(2)')
      processName = (table) ?  table.textContent.trim() : '';
    }

    if (processName != ''){
      setProcessName(fmtProcessName(processName)); 
      document.title = `SIG-Áreas[${fmtProcessName(processName)}]`;
      console.log(`Process name fetched ${processName}`);
      console.log("Document title set");        
    }

    const foundProcesses = getProcesses();    

    if (processName && processName != '' &&  foundProcesses && foundProcesses.length > 0){
      const data = await fetchCheckedProcesses(fmtProcessName(processName));
      console.log(`Checked processes fetched ${JSON.stringify(data)}`);
      console.log("Unchecking processes");
      uncheckProcesses(foundProcesses, data);
    }

    if (foundProcesses && foundProcesses.length > 0){
      const countChecked = foundProcesses.filter(process => process.checkbox.checked).length;
      const countTotal = foundProcesses.length;
      setCountChecked(countChecked);
      setCountTotal(countTotal);
      console.log(`Checked count fetched ${countChecked}`);
      console.log(`Total count fetched ${countTotal}`);                
    }
    
  }

  return <Navbar 
    checked={countChecked} 
    total={countTotal} 
    isReady={isReady} 
    processName={processName} 
  />;
}


export default SigAreasHelper;

