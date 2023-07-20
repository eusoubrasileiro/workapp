import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { clipboardCopy, rowStatus } from './utils';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip } from 'react-tooltip'


function TinyCheckBox({state, onChange}){  
  return (
    <input type='checkbox' checked={state} onChange={onChange}>
    </input>
  );
}



function Cell({key_, value, onClick, tooltip}){ // undefined is the default if not set

  if(tooltip)  
   return (
    <td key={key_} onClick={onClick} 
    data-tooltip-id="text-hidden-cell" data-tooltip-html={value} data-tooltip-variant="light">
      {value}</td>
  );  
  return (
   <td key={key_} onClick={onClick}>
     {value}</td>
 );
}


function IeTable({studyname, iestudo}){
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
    const nrows = iestudo.table.length;  
    const attrs = iestudo.attrs;
    const attrs_names = iestudo.attrs_names;    

    var attributes = []; 
    for(let i = 0; i < nrows; i++){
      let row_dict = {};
      for(let j = 0; j < attrs_names.length; j++)
        row_dict[attrs_names[j].toLowerCase()] = String(attrs[i][j]).toLowerCase();
      attributes.push(row_dict);   
    }    

    setCheckboxes(iestudo.states.checkboxes); // initial states
    setEventview(iestudo.states.eventview); // initial states

    // since order matters for styling rows -> convert nested list in dictionary
    // since javascript dictionary will now preserve order here
    var groupindexes_dict = Object.fromEntries(iestudo.states.groupindexes);        
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
        'header' : iestudo.headers, 
        'attributes' : attributes,
        'cells' : iestudo.table,
        'headindexes' : headindexes,
        'groupindexes' : groupindexes_dict, // only rendering information        
      });

  },[iestudo]);

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
          case 2:            
              rcells[i][j] = <Cell key_={td_key} 
                value={ <Link className="SCM_link" to={`/scm_page/${ name.replace('/', '-') }`} > {name} </Link> }/>; 
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
          case 9: // Observação e DOU
          case 10:
              rcells[i][j] = <Cell key_={td_key} value={table.cells[i][j]}                
              tooltip={true}
              />; 
            break;
          default:
            rcells[i][j] = <Cell key_={td_key} value={table.cells[i][j]}/>;                  
        }          
      }
      if(!row_hide_idx.includes(i))
        rows.push(<tr key={row_key} {...table.attributes[i]} >{rcells[i]}</tr>);
    }    
   
    return rows;
  }

  if (table && table.header && table.cells && studyname)   
    return (<><table id='iestudo'>   
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


function TableAnalysis() {
  const { name } = useParams();
  const [ process, setProcess ] = useState(null); 

  const fmtdname = name.replace('-','/');

  useEffect(() => {
    fetch(`/flask/analyze`, { 
      method: "POST", 
      headers: {'Content-Type': 'application/json'},     
      body: JSON.stringify({ 'name' : fmtdname })
    })
    .then(res => res.json()
    .then(data => {            
      setProcess(data);  
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
  if (process.iestudo.hasOwnProperty('table'))
    analyze_table = <IeTable studyname={fmtdname} iestudo={process.iestudo}/>

  return (
    <>
    <div className="tablecontainer">
      <div className="navbarcontainer">
        <a id='prioridade'>Prioridade: <span id='prioridade_data'>{ process.prioridade }</span> </a> 
        <Link className="SCM" to={`/scm_page/${ name.replace('/', '-') }`} > SCM </Link>  
        <button className="copyprocess" onClick={() => clipboardCopy(process.NUP)} > { process.NUP }</button>
          <div> 
            <a>1<sup>st</sup> parent: 
              {parent}
            </a> 
          </div> 
        <div>
          {rowStatus(process)}
        </div>      
      </div>        
      {analyze_table}
    </div>
    </>
  );
}

export default TableAnalysis;