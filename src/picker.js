import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect} from 'react';
import { clipboardCopy, rowStatus } from './utils';
import './index.css';


function ProcessRow({name, dados}) {

  return (
    <>
      <Link to={`/table/${ name.replace('/', '-') }`} > {name} </Link> 
      <div><img src="https://sei.anm.gov.br/imagens/sei_logo_azul_celeste.jpg" width="25"></img></div>
      <div><button className="copyprocess" onClick={() => clipboardCopy(dados['NUP'])} > { dados['NUP'] }</button> </div>
      <Link className="SCM" to={`/scm_page/${ name.replace('/', '-') }`} > SCM </Link>       
      {dados['tipo']}
      {rowStatus(dados)}     
    </> 
  )   
}

function ProcessRows({processos}) {    
  const rows = []; // assemly an array of ProcessRow's
    for(const [key, value] of Object.entries(processos)){
      rows.push(
        // react needs a 'key' property for each list item
        <li key={key}>            
            <div className="flexcontainer">
              <ProcessRow name={key} dados={value} />          
            </div>
        </li>);
    }
  return (<>{rows}</>)  
}


function PickProcess(){
  const [data, setData] = useState([]);
  const [processos, setProcessos] = useState({});

  function fetchData(fast){
    // fast can be 'true' or 'false'
    fetch(`/flask/list`, 
      { headers: { 
        'fast-refresh': fast } })
    .then(res => res.json()
    .then(data => {
      setData(data.status);
      setProcessos(data.processos);          
    }))
    .catch((error) => {      
      console.info(`Error on PickProcess request ${error}`);
    });      
  }

  // F5 or refresh causes a slow-refresh since SessionStorage is cleaned to 0
  // going to another page and comming back keeps the counters running
  function slowRefreshIf(){
    const currentTime = new Date().getTime();
    const prevtime = sessionStorage.getItem('prevtime') || 0;
    let timeDifference = currentTime - prevtime;      
    // console.log(`timeDifference ${timeDifference}`);
    if (timeDifference >= 20000) {
      sessionStorage.setItem('prevtime', currentTime);
      fetchData('false');      
    } 
  }

  useEffect(() => {
    document.title = "Work";    
    fetchData('true'); // first call must be fast
    const time_check = setInterval(() => { slowRefreshIf(); }, 500);
    return () => {  // on unmount component
      clearInterval(time_check);  // remove the timer    
    }; 
  }, []); // will run only once

  if (processos.length == 0) { // conditional rendering otherwise `processos` undefined
    return <div>Loading...</div>;
  } 

  return (
    <div>
      <h2>Pick a process</h2>
      <ol>                                      
        <ProcessRows processos={processos}/>           
      </ol>
      <footer>    
        <div>Working folder: {data.workfolder}</div>        
        <div>Press F5 to reload from database</div>        
        <div>Loaded {data.dbloaded} processes from database in {data.timespent} seconds. </div>
      </footer>
    </div> 
  )    

} 

export default PickProcess;