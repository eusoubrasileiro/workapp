import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect} from 'react';
import { clipboardCopy, rowStatus } from './utils';
import './index.css';

const Button = ({ onClick, children }) => {
  const buttonStyle = {
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    cursor: 'pointer',
  };
  return (
    <button style={buttonStyle} onClick={onClick}>
      {children}
    </button>
  );
};

function ProcessRow({name, dados}) {
  const [pdados, setPDados] = useState([]);

  useEffect(() => {
    setPDados(dados);    
  }, []); // will run only once

  function download(){
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
  }

  if(Object.keys(pdados).length == 0)
    return (<>
      {rowStatus(pdados)}  
      <a>{name}</a> 
      <div><img src="https://sei.anm.gov.br/imagens/sei_logo_azul_celeste.jpg" width="25"></img></div>
      <div><button className="copyprocess" onClick={() => clipboardCopy(name)} > { name }</button> </div>
      <a className="SCM" > 📁 </a>       
      <a className="Poligonal" > ▱ </a>      
      <Button className="DownloadMissing" onClick={()=> download()} children={'Download Missing'}/>        
    </>
    )

  return (
    <>
      {rowStatus(pdados)}   
      <Link to={`/table/${ name.replace('/', '-') }`} > {name} </Link> 
      <div><img src="https://sei.anm.gov.br/imagens/sei_logo_azul_celeste.jpg" width="25"></img></div>
      <div><button className="copyprocess" onClick={() => clipboardCopy(pdados['NUP'])} > { pdados['NUP'] }</button> </div>
      <Link className="SCM" to={`/scm_page/${ name.replace('/', '-') }`} > 📁 </Link>       
      <Link className="Poligonal" to={`/polygon_page/${ name.replace('/', '-') }`} > ▱ </Link>      
      {pdados['tipo']}        
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

  useEffect(() => {
    document.title = "Work";    
    fetchData(); 
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
      </footer>
    </div> 
  )    

} 

export default PickProcess;