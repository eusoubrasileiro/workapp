import React from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './index.css';


function ProcessRow({name, dados}) {
  function clipboardCopyNup(){         
    // property doesnt exist if not running from localhost or https 
    // TODO: check -> window.isSecureContext and alert      
    navigator.clipboard.writeText(`${dados['NUP']}`);
  }
  
  function rowStatus(){
    if(dados.hasOwnProperty('iestudo')){
      if(dados.iestudo.done)
        return <a>&#9989;</a>       
      else 
        return <a>&#x23F3;</a>                         
    }
    else
      return <a>&#10060;</a>
  }

  return (
    <>
      <Link to={`/table/${ name.replace('/', '-') }`} > {name} </Link> 
      <div><img src="https://sei.anm.gov.br/imagens/sei_logo_azul_celeste.jpg"></img></div>
      <div><button className="copyprocess" onClick={clipboardCopyNup} > { dados['NUP'] }</button> </div>
      <a className="SCM" href={`/flask/process?process=${name}`} target="_blank">SCM</a> 
      {dados['tipo']}
      {rowStatus()}     
    </> 
  )   
}

function ProcessRows({processos}) {    
  const rows = []; // assemly an array of ProcessRow's
    for(let i=0; i<processos.length; i++){
      rows.push(
        // react needs a 'key' property for each list item
        <li key={processos[i][0]}>            
            <div className="flexcontainer">
              <ProcessRow name={processos[i][0]} dados={processos[i][1]} />          
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