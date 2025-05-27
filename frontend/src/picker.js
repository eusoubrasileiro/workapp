import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect} from 'react';
import { clipboardCopy, Button } from './utils';
import { EstudoStatusButton } from './status';
import { useNavigation } from './navigation.js';
import './index.css';
import './loader.css';
import { fmtProcessName } from './utils';

function ProcessRow({index, name, dados, setLoading}) {

  function redo(){
    setLoading(true);
    fetch(`/flask/process/${fmtProcessName(name)}/redo`)
    .then(res => res.json()
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
                        && dados.prework.status != 'ok') ? 
                        <>{dados.prework.status.error}</> :  
                        <></>;
  let hasEstudo = dados.hasOwnProperty('estudo');
  let hasDados = Object.keys(dados).length > 0;
  let hasGraph = (dados.hasOwnProperty('associados') 
                  && Object.keys(dados.associados.graph).length > 0)

  let isPublished = false;

  if(dados.hasOwnProperty('work') && 
    dados.work.hasOwnProperty('published') &&
    dados.work.published){
    isPublished = true;
  }

  let nup = dados?.NUP || '';
  let tipo = dados?.tipo || '';
  
  return (
    <>      
      <td>{index+1}</td>
      <td>
        { isPublished 
        ? '⬆'        
        : '⁃'
        }
      </td>
      <td><EstudoStatusButton name={name} dados={dados} /></td>   
      <td>
        { hasDados
          ? <Link to={`/files/${ fmtProcessName(name) }`} > Files </Link>
          : <div> Files </div>
        }
      </td>
      <td>
        { hasEstudo
        ? <Link to={`/table/${ fmtProcessName(name) }`} > {name} </Link>
        : <a>{name}</a>
        }
      </td>
      <td>        
        <button className="copyprocess" onClick={() => clipboardCopy(nup)} > { nup }</button> 
      </td>      
      <td>
        { hasDados 
          ? <Link className="SCM" to={`/scm_page/${ fmtProcessName(name) }`} > SCM </Link> 
          : <a className="SCM" > SCM </a> 
        }   
      </td>   
      <td>
        { hasDados
          ? <Link className="Poligonal" to={`/polygon_page/${ fmtProcessName(name) }`} > ▱ </Link>           
          : <a className="Poligonal" > ▱ </a>    
        }
      </td>
      <td>
        {
         hasGraph 
         ? <Link className="Graph" to={`/graph/${ fmtProcessName(name) }`} > ☍ </Link>
         :  <a className="Graph" > ☍ </a> 
        }
      </td>
      <td>
      {tipo}                    
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
  const [month, setMonth] = useState(new Date().toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())); 
  const { setProcessList } = useNavigation();

  function fetchData(sorted=''){    
    sorted = (sort!=sorted)? sorted: '';    
    fetch(`/flask/work/list`, { 
      method: "POST", 
      headers: {'Content-Type': 'application/json'},     
      body: JSON.stringify({ 'sorted' : sorted })
    })
    .then(res => res.json()
    .then(data => {
      setInfo(data.status);
      setProcessos(data.processos);
      // Update the global process list for navigation
      setProcessList(data.processos);          
    }))
    .catch((error) => {      
      console.info(`Error on fetchData ${error}`);
    });      
    setSort(sorted);
  }


  useEffect(() => {
    setLoading(true);
    document.title = "Work";    
    fetchData(); 
    setLoading(false);
  }, []); // will run only once

  useEffect(() => {
  }, [sort])


  let hasDados = (processos)? true: false;

  return (    
    <div className='selectProcess'>      
    <div className='published'>{month} Total Published {info.published}</div>    
      <table className='Processes'>
        <thead>
          <tr>
            <th>  </th>
            <th><img src="https://sei.anm.gov.br/imagens/sei_logo_azul_celeste.jpg" width="25"></img></th>
            <th>STATUS</th>
            <th>FILES</th>
            <th><Button onClick={() => fetchData('name')}>Name</Button></th>
            <th><img src="https://sei.anm.gov.br/imagens/sei_logo_azul_celeste.jpg" width="25"></img></th>
            <th>SCM</th>
            <th>Polygon</th>
            <th>Graph</th>
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