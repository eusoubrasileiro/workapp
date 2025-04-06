import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
// data-text: is a tool to load css files as a string
import styleText from "data-text:contents/style.css"
import { useState, useEffect } from "react"
import { waitForSelector } from "./playwright"

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



function Navbar({checked, total, isReady, processName, isFinished, saveMessage}: 
  {checked: number, total: number, isReady: boolean, processName: string, isFinished: boolean, saveMessage: string}) {
 
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
          <span id="workapp-finished-study">{isFinished ? "Finalizado" : ""}</span>
          <span id="workapp-finished-study-message">{saveMessage}</span>
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
  let sleep_between_clicks = 450;   

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
        const checkbox = uiprocess.checkbox;         
        // avoid DOM updates from React invalidating the checkbox        
        setTimeout(() => {
          if (checkbox) {
            console.log(`Unchecking process ${uiprocess.processNumber}`);               
            checkbox.click();            
            let style = checkbox.style;
            style.color = 'red';
            style.fontWeight = 'bolder';
            style.fontStyle = 'normal';    
          }
        }, sleep_between_clicks);
        sleep_between_clicks += sleep_between_clicks;
      }
    });
  }
}

async function finished(fullProcessName: string) : Promise<number> {      
  const backend_url = "http://127.0.0.1:5000/flask"
  console.log(`Finished request ${fullProcessName}`);
  const response = await fetch(`${backend_url}/estudo_finish`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      // Send cookie as data
      body: JSON.stringify({ 
        fullProcessName : fullProcessName,
        estudoType : 'interference', 
      }),
    })
    .then(response => {
      if (response.ok) {
        return response.status;
      } else {
        throw new Error('Network response was not ok');
      }
    });
    return response;
}

function SigAreasHelper() {
  const [page, setPage] = useState('');
  const [processName, setProcessName] = useState('');
  const [fullProcessName, setFullProcessName] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [countChecked, setCountChecked] = useState(0);
  const [countTotal, setCountTotal] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [observerCheckboxes, setObserverCheckboxes] = useState<MutationObserver>();

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      console.log("Enter pressed – reinitializing...")
      updateEverything()  // your function to refresh counts, processes, etc.
    }
  }


  const handleMouseDown = async (e: MouseEvent) => {
    console.log("Mouse down event detected");
    // Add your logic here to handle the mouse down event
    if (e) {
      console.info("mousedown  target is "+ e.target );
      if (e.target instanceof HTMLElement && 
          (e.target.textContent.includes("Gerar Relatório") || 
           e.target.textContent.includes("Finalizar"))) {        
        if(!isFinished){
          const status = await finished(fullProcessName);
          if(status == 204){
            setIsFinished(true);
            setSaveMessage('Saved!');
          }
          if(status == 404){
            setIsFinished(true);
            setSaveMessage('NOT FOUND! But file Saved on folder!');
          }         
        }
      }
    }
  }

  useEffect(() => {
    let observer: MutationObserver;
    const targetNode = document.body;
    const config = { childList: true, subtree: true };
    let isWaiting = false;

    const waitForPageReady = async () => {
      try {        
        const canvas = await waitForSelector("div canvas", "attached", 10000);
        console.log("Waiting for spinner");
        await waitForSelector("div.ant-spin-spinning[aria-busy='true']", "attached", 60000);
        console.log("Spinner found");
        await waitForSelector("div.ant-spin-spinning[aria-busy='true']", "detached", 120000);
        console.log("Spinner gone");
  
        if (canvas) {
          if (!isReady) setIsReady(true);
          updateEverything();
          observer.disconnect(); // Stop observing once ready
        }
      } catch (e) {
        console.warn("Page didn't become ready in time.", e);
      }
    }
  
    const mutationCallback: MutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          // Trigger readiness check
          const currentUrl = window.location.href
          if (currentUrl.includes("retirada-interferencia/edit") && !isWaiting && !isReady) {
            isWaiting = true;
            setPage("retirada-interferencia")
            console.log("Waiting for page ready");
            waitForPageReady();
          }
        }
      }
    }
  
    observer = new MutationObserver(mutationCallback)
    observer.observe(targetNode, config)
  
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("mousedown", handleMouseDown)
  
    return () => {
      observer.disconnect()
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("mousedown", handleMouseDown)
    }
  }, [])
  
  const checkboxesChanged: MutationCallback = (mutationsList) => {
    console.log("Interference table changed");
    if (mutationsList.length > 0){      
      const foundProcesses = getProcesses();
      if (foundProcesses?.length > 0){
        const countChecked = foundProcesses.filter(process => process.checkbox.checked).length;
        const countTotal = foundProcesses.length;
        setCountChecked(countChecked);
        setCountTotal(countTotal);
      }
    }
  }

  const updateEverything = async () => {
    
    let processName = null;

    if (document) {
      let nameTable = document.querySelector('tr[data-row-key="1"] td:nth-child(2)')
      if (nameTable){
        processName = nameTable.textContent.trim();
      }
    }

    // Observe the table for changes in the checkboxes
    let interferenceTable = document.querySelector("div[class='ant-tabs-content ant-tabs-content-top']") as HTMLDivElement;
    if (interferenceTable){
      console.log("Interference table found registering observer");
      const observer = new MutationObserver(checkboxesChanged);
      observer.observe(interferenceTable, {subtree: true, childList: true, attributes: true, attributeFilter: ['checked', 'class']});
      setObserverCheckboxes(observer);
    }

    if (processName){
      setProcessName(fmtProcessName(processName)); 
      setFullProcessName(processName);
      document.title = `SIG-Áreas[${fmtProcessName(processName)}]`;
      console.log(`Process name fetched ${processName}`);
      console.log(`Document title set ${document.title}`);        

      const foundProcesses = getProcesses();    
      const data = await fetchCheckedProcesses(fmtProcessName(processName));
      console.log(`Checked processes fetched ${JSON.stringify(data)}`);
      console.log("Unchecking processes");
      uncheckProcesses(foundProcesses, data);    
      
    }
    
  }

  return <Navbar 
    checked={countChecked} 
    total={countTotal} 
    isReady={isReady} 
    processName={processName} 
    isFinished={isFinished}
    saveMessage={saveMessage}
  />;
}


export default SigAreasHelper;

