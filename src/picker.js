import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect} from 'react';
import { clipboardCopy, Button, estudoStatus } from './utils';
import './index.css';
import './loader.css';

function ProcessRow({index, name, dados, setLoading}) {
  // const [dados, setDados] = useState([]);

  // useEffect(() => {
  //   setDados(dados);    
  // }, []); // will run only once

  // function download(){
  //   setLoading(true);
  //   // fast can be 'true' or 'false'
  //   fetch(`/flask/download?process=${name}`)
  //   .then(res => res.json()
  //   .then(data => {
  //     setPDados(data); // set and wait    
  //     // a refresh... ok for now
  //   }))
  //   .catch((error) => {      
  //     console.info(`Error on downloading process request ${error}`);
  //   }); 
  //   setLoading(false);
  // }

  function redo(){
    setLoading(true);
    fetch('/flask/redo',
      {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json'},        
        body: JSON.stringify({process : name}),
      }
    ).then(res => res.json()
    .then(data => {      
      console.info("remake done");
    }))
    .catch((error) => {      
      console.info(`Error on downloading process request ${error}`);
    });    
    setLoading(false);
  }

  if(dados == undefined)
    return (<><td></td></>)

  let preworkstatus = (dados.hasOwnProperty('prework') 
                        && dados.prework.status == 'error') ? 
                        <>{dados.prework.error}</> :  
                        <></>;
  let hasEstudo = dados.hasOwnProperty('estudo');
  let hasDados = Object.keys(dados).length > 0;
  
  return (
    <>      
      <td>{index+1}</td> 
      <td>{estudoStatus(dados)}</td>   
      <td>
        { hasEstudo
        ? <Link to={`/table/${ name.replace('/', '-') }`} > {name} </Link>
        : <a>{name}</a>
        }
      </td>
      <td>        
        <button className="copyprocess" onClick={() => clipboardCopy(dados['NUP'])} > { dados['NUP'] }</button> 
      </td>      
      <td>
        { hasDados 
          ? <Link className="SCM" to={`/scm_page/${ name.replace('/', '-') }`} > 📁 </Link> 
          : <a className="SCM" > 📁 </a> 
        }   
      </td>   
      <td>
        { hasDados
          ? <Link className="Poligonal" to={`/polygon_page/${ name.replace('/', '-') }`} > ▱ </Link>           
          : <a className="Poligonal" > ▱ </a>    
        }
      </td>
      <td>
      {dados['tipo']}                    
      </td>
      <td> <Button style='danger' onClick={()=> redo()} children={<span>⟲</span> }/> </td> 
      <td>
        <div className='errorStatus'>{preworkstatus}</div>
      </td>
    </> 
  )   
}


function PickProcess(){
  const [info, setInfo] = useState({});
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('')

  function fetchData(sorted=''){    
    sorted = (sort!=sorted)? sorted: '';    
    fetch(`/flask/list`, { 
      method: "POST", 
      headers: {'Content-Type': 'application/json'},     
      body: JSON.stringify({ 'sorted' : sorted })
    })
    .then(res => res.json()
    .then(data => {
      setInfo(data.status);
      setProcessos(data.processos);          
    }))
    .catch((error) => {      
      console.info(`Error on fetchData ${error}`);
    });      
    setSort(sorted);
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

  useEffect(() => {
  }, [sort])

  // if (processos.length == 0) { // conditional rendering otherwise `processos` undefined
  //   return <div>Loading...</div>;
  // } 

  let hasDados = (processos)? true: false;

  return (
    <div className='selectProcess'>      
      <table className='Processes'>
        <thead>
          <tr>
            <th>  </th>
            <th>  </th>
            <th><Button onClick={() => fetchData('name')}>Name</Button></th>
            <th><img src="https://sei.anm.gov.br/imagens/sei_logo_azul_celeste.jpg" width="25"></img></th>
            <th>SCM</th>
            <th>Polygon</th>
            <th><Button onClick={() => fetchData('type')}>type</Button></th>
            <th>redo</th>
            <th><Button onClick={() => fetchData('error')}>error</Button></th>
          </tr>  
        </thead>
        <tbody>
          { hasDados &&
          processos.map((item, index) => {
              let [name_, attrs] = [item.name, item.data]; // { 'name' : 'xxx.xxx/xxxx', 'data' : {...}}
              // react needs a 'key' property for each list item
              return <tr key={index}> 
                      <ProcessRow index={index} name={name_} dados={attrs} setLoading={setLoading} /> 
                     </tr>;
          })
          }  
        </tbody>          
      </table>    
      <div>Working folder: {info.workfolder}</div>
    </div> 
  )   

} 

export default PickProcess;