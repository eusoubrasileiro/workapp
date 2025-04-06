

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


export { fmtProcessName, fetchCheckedProcesses }
