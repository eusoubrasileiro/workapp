import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { clipboardCopy } from './utils';
import { EstudoStatusButton } from './status';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip'
import { fmtProcessName } from './utils';
import FilesViewer from './filesviewer';

function TinyCheckBox({state, onChange}){  
  return (
    <input type='checkbox' checked={state} onChange={onChange}>
    </input>
  );
}



function Cell({key_, value, onClick, tooltip, tooltip_text}){ // undefined is the default if not set
  tooltip_text = (tooltip_text)? tooltip_text: value;
  if(tooltip)  
   return (
    <td key={key_} onClick={onClick} 
    data-tooltip-id="text-hidden-cell" data-tooltip-html={tooltip_text} data-tooltip-variant="light">
      {value}</td>
  );  
  return (
   <td key={key_} onClick={onClick}>
     {value}</td>
 );
}


function IeTable({studyname, estudo}){
  // arrays of same size for checkboxes and showevents states  
  const [ table, setTable] = useState({});
  const [ checkboxes, setCheckboxes] = useState({});
  const [ eventview, setEventview] = useState({});
  

  function saveCheckboxes(checkboxes_){
    fetch("/flask/update_checkbox", {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ 'name' : studyname, 'data' : checkboxes_ })
    }).then(function(response) {
      // $("body").css("cursor", "default"); /* default cursor */
    })
    .catch((error) => {      
      alert(`Error on saveCheckboxes request ${error}`);
    });       
  }

  function saveEventview(eventview_){
    fetch("/flask/update_eventview", {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ 'name' : studyname, 'data' : eventview_ })
    }).then(function(response) {
      // $("body").css("cursor", "default"); /* default cursor */
    })
    .catch((error) => {      
      alert(`Error on saveEventview request ${error}`);
    });    
  }

  function onChangeCheckbox(name){ 
    console.info('onChangeCheckbox ' + name);
    let checkboxes_ = {...checkboxes}; // old state
    checkboxes_[name] = !checkboxes_[name];        
    setCheckboxes(checkboxes_);
    saveCheckboxes(checkboxes_);
  } 

  function onChangeShowEvents(name){ 
    console.info('onChangeShowEvents ' + name);
    let eventview_ = {...eventview}; // old state
    eventview_[name] = !eventview[name];    
    setEventview(eventview_);
    saveEventview(eventview_);
  }  

  // this should only create data and set state variables
  useEffect(() => {
    const nrows = estudo.table.length;  
    const attrs = estudo.attrs;
    const attrs_names = estudo.attrs_names;    

    var attributes = []; 
    for(let i = 0; i < nrows; i++){
      let row_dict = {};
      for(let j = 0; j < attrs_names.length; j++)
        row_dict[attrs_names[j].toLowerCase()] = String(attrs[i][j]).toLowerCase();
      attributes.push(row_dict);   
    }    

    setCheckboxes(estudo.states.checkboxes); // initial states
    setEventview(estudo.states.eventview); // initial states

    // since order matters for styling rows -> convert nested list in dictionary
    // since javascript dictionary will now preserve order here
    var groupindexes_dict = Object.fromEntries(estudo.states.groupindexes);        
    // add c0 or c1 class to group of process rows
    Object.entries(groupindexes_dict).forEach(([name, indexes], index) =>{       
      let [start, end] = indexes.map(item => Number(item));       
      for(let i=start; i<end; i++)
          attributes[i] = Object.assign(attributes[i], {className : `c${index%2}`});
    });
    var headindexes = Object.values(groupindexes_dict).map((element) => {
      return Number(element[0]);
    });

    setTable({
        'header' : estudo.headers, 
        'attributes' : attributes,
        'cells' : estudo.table,
        'headindexes' : headindexes,
        'groupindexes' : groupindexes_dict, // only rendering information        
      });

  },[estudo]);

  // this should only plot
  // dont mess with state variables only slice/clone them before using  
  function renderTableRows(){        
    var rcells = table.cells.map( (arr) => arr.slice() ); 
    var rows = [];          

    let row_hide_idx = []
    // remove event lines from table for creating <tr> rows
    Object.entries(eventview).forEach( ([name, state]) => {
      if(!state){ // if state is False remove event lines from that name process from table
          let [start, end] = table.groupindexes[name]; // groupindexes stores range of rows a list [start, end] as string not numbers (came from flask backend)
          for(let i=Number(start)+1; i<Number(end); i++) // remove all rows in ]start, end[
            row_hide_idx.push(i);
      }
    });     
    
    // console.info('headindexes', headindexes);
    for(let i=0; i<rcells.length; i++){
      // generate a unique key for each child
      const row_key = i;
      for(let j=0; j<rcells[0].length; j++){                         
        let name = table.cells[i][2];          
        const td_key = i*rcells[0].length+j;
        switch(j){          
          case 2: // Processo - tooltip or onhover show only if attribute['popc'] = 'true'
            if(table.headindexes.includes(i)){
              let tooltip_text = false;
              if(table.attributes[i].popc === 'true') // do something to show it for this process a tooltip?           
                tooltip_text = "<bold>Multiplas Poligonais e Exigência.<br>Faça esta Opção Primeiro!</bold>";
              rcells[i][j] = <Cell key_={td_key}  tooltip={tooltip_text?true:false}  tooltip_text={tooltip_text}
                value={<> 
                  <Link className="SCM_link" to={`/scm_page/${ fmtProcessName(name) }`} > {name} </Link> 
                  <Link className="Poligonal" to={`/polygon_page/${ fmtProcessName(name) }`} > ▱ </Link> </> 
                }/>; 
            }
            else
              rcells[i][j] = <Cell key_={td_key} value={table.cells[i][j]}/>;
            break;
          case 1: // 'Ativo' turn true-false on sSim-Não
            let text = (table.cells[i][j]=='True') ? '●' : (table.cells[i][j]=='False')? '✗' : '';
            rcells[i][j] = <Cell key_={td_key} value={text}/>;     
            break;
          case 0: // 'Prior' checkbox - use 3rd column index 2 to get Process name [key]          
            if(table.headindexes.includes(i))
              rcells[i][j] = <Cell key_={td_key} value={<TinyCheckBox state={checkboxes[name]}
                onChange={() => onChangeCheckbox(name)}/>}/>;
            else 
              rcells[i][j] = <Cell key_={td_key} value={table.cells[i][j]}/>;      
            break;
          case 5: // 'Descrição' [5] - add event view change handler
            if(table.headindexes.includes(i))
            rcells[i][j] = <Cell key_={td_key} value={table.cells[i][j]}  
              onClick={() => onChangeShowEvents(name)}/>; 
            else
              rcells[i][j] = <Cell key_={td_key} value={table.cells[i][j]}/>;      
            break;            
          case 7: // Observação e DOU
          case 8:
              rcells[i][j] = <Cell key_={td_key} value={table.cells[i][j]}                
              tooltip={true}
              />; 
            break;
          default:
            rcells[i][j] = <Cell key_={td_key} value={table.cells[i][j]}/>;                  
        }          
      }
      if(!row_hide_idx.includes(i)){        
        rows.push(<tr key={row_key} {...table.attributes[i]} >{rcells[i]}</tr>);
      }
      
    }    
   
    return rows;
  }

  if (table && table.header && table.cells && studyname)   
    return (<>
              <div id="checkboxes">Prioritários {Object.values(checkboxes).filter(value => value === true).length}/{Object.keys(checkboxes).length}</div>
              <table id='estudo'>   
              <thead>
                {<tr>{table.header.map((value) => <th key={value}>{value}</th> )}</tr>}
              </thead>    
              <tbody>
              {renderTableRows()}
              </tbody>
            </table>
            <Tooltip id="text-hidden-cell" 
              className="tooltipstyle" />
            </>);
  else
    return <div>Loading...</div>;
}


function Prioridade(process){  // show prioridade / prioridadec side-by-side
  var prioridadec = 'same';
  var style = 'ok';
  if(process.hasOwnProperty('prioridadec') && process.prioridade != process.prioridadec){
    prioridadec ='⚠️'+prioridadec;  
    style='warn'; 
  }
  return <a className='prioridade'>Prioridade <span id='scm'>{process.prioridade}</span>↔<span id='graph' className={style}>{prioridadec}</span></a>
} 

function TableAnalysis() {
  const { name } = useParams();
  const [ process, setProcess ] = useState(null); 
  const [ viewfiles, setViewfiles ] = useState(false);

  useEffect(() => {
    fetch(`/flask/process/${fmtProcessName(name)}/analyze`)
    .then(res => res.json()
    .then(data => {            
      setProcess(data);  
      setViewfiles(data?.work?.published);
    }))
    .catch((error) => {      
      console.info(`Error on Table request ${error}`);
    });       
  }, []); // will run only once

  // Must always use conditional rendering to wait for variables loading
  // and definition otherwise Error: `process.prioridade` undefined 
  if (!process )  
    return <div>Loading...</div>;    
  let parent = process.parents ? process.parents[0] : 'None'; // leilão or disponibilidade
  document.title = `${name}`;


  let analyze_table = <h3>No table found!</h3>;
  if (process.estudo.hasOwnProperty('table'))
    analyze_table = <IeTable studyname={fmtProcessName(name)} estudo={process.estudo}/>

  const name_ = fmtProcessName(name);
  const last_event = process.eventos?.[1]?.[0]; // description of last event
  const event_count = process.eventos.length-1; // count of last event -1 header

  return (
    <>
    <div className="tablecontainer">
      <div className="navbarcontainer">
        <div className="event_type">
          <a id='tipo'> { process.tipo }</a>          
          <a id='event_count'> Total: { event_count }</a> 
          <a id='evento'> Last: { last_event }</a>          
        </div>
        { Prioridade(process) }        
        <Link className="SCM" to={`/scm_page/${ name_ }`} > 📁 </Link>  
        <Link className="Poligonal" to={`/polygon_page/${ name_ }`} > ▱ </Link>
        <Link className="Graph" to={`/graph/${ name_ }`} > ☍ </Link>
        <button className="copyprocess" onClick={() => clipboardCopy(process.NUP)} > { process.NUP }</button>
        <div> 
          <a>1<sup>st</sup> parent: 
            {parent}
          </a> 
        </div> 
        <div>
          <EstudoStatusButton name={fmtProcessName(name)} dados={process} />
        </div>              
      </div>        
      {analyze_table}
    </div>
    <div id='filesviewer'>
      {viewfiles ? <FilesViewer name={name} />
       : <button onClick={() => setViewfiles(true)}>View Files</button>}
    </div>
    </>
  );
}

export default TableAnalysis;