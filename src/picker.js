import React from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import { clipboardCopy, rowStatus } from './utils';


function ProcessRow({name, dados}) {

  return (
    <>
      <Link to={`/table/${ name.replace('/', '-') }`} > {name} </Link> 
      <div><img src="https://sei.anm.gov.br/imagens/sei_logo_azul_celeste.jpg"></img></div>
      <div><button className="copyprocess" onClick={() => clipboardCopy(dados['NUP'])} > { dados['NUP'] }</button> </div>
      <a className="SCM" href={`/flask/process?process=${name}`} target="_blank">SCM</a> 
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


function PickProcess({data, processos}){

  useEffect(() => {        
    document.title = "Work";     
  }, []); // will run only once

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