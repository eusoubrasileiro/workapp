import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect} from 'react';
import { clipboardCopy, Button, estudoStatus } from './utils';
import './index.css';
import './loader.css';

function ProcessRow({name, dados, setLoading}) {
  const [pdados, setPDados] = useState([]);

  useEffect(() => {
    setPDados(dados);    
  }, []); // will run only once

  function download(){
    setLoading(true);
    // fast can be 'true' or 'false'
    fetch(`/flask/download?process=${name}`)
    .then(res => res.json()
    .then(data => {
      setPDados(data); // set and wait    
      // a refresh... ok for now
    }))
    .catch((error) => {      
      console.info(`Error on downloading process request ${error}`);
    }); 
    setLoading(false);
  }

  function preworkStatus(dados){
    if(dados.hasOwnProperty('prework') && dados.prework.status == 'error')
      return <>{dados.prework.error}</>;
    return <></>;
  }

  let hasEstudo = dados.hasOwnProperty('estudo');
  let hasDados = Object.keys(pdados).length > 0;

  return (
    <>
      {estudoStatus(pdados)}   
      { hasEstudo
        ? <Link to={`/table/${ name.replace('/', '-') }`} > {name} </Link>
        : <a>{name}</a>
      }      
      <div><img src="https://sei.anm.gov.br/imagens/sei_logo_azul_celeste.jpg" width="25"></img></div>
      <div><button className="copyprocess" onClick={() => clipboardCopy(pdados['NUP'])} > { pdados['NUP'] }</button> </div>
      { hasDados 
        ? <Link className="SCM" to={`/scm_page/${ name.replace('/', '-') }`} > 📁 </Link> 
        : <a className="SCM" > 📁 </a> 
      }      
      { hasDados
        ? <Link className="Poligonal" to={`/polygon_page/${ name.replace('/', '-') }`} > ▱ </Link>           
        : <a className="Poligonal" > ▱ </a>    
      }
      {pdados['tipo']}                    
      <Button style='danger' onClick={()=> download()} children={'🛠redo'}/>
      <div className='errorStatus'>{preworkStatus(pdados)}</div>
    </> 
  )   
}

function ProcessRows({processos, setLoading}) {    
  const rows = []; // assemly an array of ProcessRow's
    for(const [key, value] of Object.entries(processos)){
      rows.push(
        // react needs a 'key' property for each list item
        <li key={key}>            
            <div className="flexcontainer">
              <ProcessRow name={key} dados={value} setLoading={setLoading} />          
            </div>
        </li>);
    }
  return (<>{rows}</>)  
}


function PickProcess(){
  const [data, setData] = useState([]);
  const [processos, setProcessos] = useState({});
  const [loading, setLoading] = useState(true);

  function fetchData(){
    // fast can be 'true' or 'false'
    fetch(`/flask/list`)
    .then(res => res.json()
    .then(data => {
      setData(data.status);
      setProcessos(data.processos);          
    }))
    .catch((error) => {      
      console.info(`Error on PickProcess request ${error}`);
    });      
  }

  // function setLoading(value){
  //   if (value) {
  //     document.body.classList.add('wait-cursor');
  //   } else {
  //     document.body.classList.remove('wait-cursor');
  //   }
  //   setLoading(value);
  // }


  useEffect(() => {
    setLoading(true);
    document.title = "Work";    
    fetchData(); 
    setLoading(false);
  }, []); // will run only once

  // if (processos.length == 0) { // conditional rendering otherwise `processos` undefined
  //   return <div>Loading...</div>;
  // } 

  return (
    <div className='selectProcess'>      
      <h2>Select a process</h2>      
      <ol>                                      
        <ProcessRows processos={processos} setLoading={setLoading}/>           
      </ol>      
      <div>Working folder: {data.workfolder}</div>
    </div> 
  )    

} 

export default PickProcess;