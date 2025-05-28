import { EstudoStatusButton } from './status';
import { clipboardCopy } from './utils';
import { Link } from 'react-router-dom';
import { fmtProcessName } from './utils';
import { NavigationIndicator } from './navigation';

function Prioridade(process){  // show prioridade / prioridadec side-by-side
    var prioridadec = 'same';
    var style = 'ok';
    if(process.hasOwnProperty('prioridadec') && process.prioridade != process.prioridadec){
      prioridadec ='⚠️'+prioridadec;  
      style='warn'; 
    }
    return <a className='prioridade'>Prioridade <span id='scm'>{process.prioridade}</span>↔<span id='graph' className={style}>{prioridadec}</span></a>
  } 
  

function  EventView({process}){
    const event_count = process.eventos.length-1; // count of last event -1 header
    const last_event = process.eventos?.[1]?.[0]; // description of last event
    // if no events, show -
    if(!process){
        return (
        <div className="event_type">
        <a id='tipo'> - </a>          
        <a id='event_count'> Total: -</a> 
        <a id='evento'> Last: -</a>          
        </div>
        );
    }
    return (
        <div className="event_type">
            <a id='tipo'> { process.tipo }</a>          
            <a id='event_count'> Total: { event_count }</a> 
            <a id='evento'> Last: { last_event }</a>          
        </div>
    );
}

function ProcessRow({name, process, processInfo=null}) {
    const isPublished = process?.work?.published ? true : false;    
    const parent = process.parents ? process.parents[0] : 'None'; // leilão or disponibilidade
    const name_ = fmtProcessName(name);
    let prework_error = process?.prework?.status != 'ok' ? process.prework.status.error : '';    

    return (
        <>        
        <div className="navbarcontainer">            
            <div>
            { isPublished 
            ? '⬆'        
            : '⁃'
            }
            </div>
            <div>
            <EstudoStatusButton name={name_} dados={process} />
            </div>            
            <EventView process={process} />
            { Prioridade(process) }        
            <Link className="SCM" to={`/scm_page/${ name_ }`} > SCM </Link>  
            <Link className="Poligonal" to={`/polygon_page/${ name_ }`} > ▱ </Link>
            <Link className="Graph" to={`/graph/${ name_ }`} > ☍ </Link>
            <button className="copyprocess" onClick={() => clipboardCopy(process.NUP)} > { process.NUP }</button>
            <div> 
            <a>1<sup>st</sup> parent: 
                {parent}
            </a> 
            </div>
            <div className='errorStatus'>
                {prework_error}                
            </div>            
            {processInfo ? <NavigationIndicator processInfo={processInfo} /> : ''} 
        </div>
        </>
        );
}


export default ProcessRow;