import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { clipboardCopy, rowStatus } from './utils';
import { v4 as uuidv4 } from 'uuid';


function TinyCheckBox({state, onChange}){  
  return (
    <input type='checkbox' checked={state} onChange={onChange}>
    </input>
  );
}

function Cell({value, onClick}){ // undefined is the default if not set
   return (
    <td key={uuidv4()} onClick={onClick}>{value}</td>
  );
}

function IeTable({iestudo}){
  // arrays of same size for checkboxes and showevents states  
  const [ table, setTable] = useState({});
  const [ checkboxes, setCheckboxes] = useState({});
  const [ eventview, setEventview] = useState({});

  function onChangeCheckbox(name){ 
    console.info('onChangeCheckbox ' + name);
    let checkboxes_ = {...checkboxes}; // old state
    checkboxes_[name] = !checkboxes_[name];    
    setCheckboxes(checkboxes_);
    // TODO: update backend
  } 

  function onChangeShowEvents(name){ 
    console.info('onChangeShowEvents ' + name);
  }  

  // this should only create data and set state variables
  useEffect(() => {
    const nrows = iestudo.nrows;  
    const attrs = iestudo.attrs;
    const attrs_names = iestudo.attrs_names;       

    var attributes = []; 
    for(let i = 0; i < nrows; i++){
      let row_dict = {};
      for(let j = 0; j < attrs_names.length; j++)
        row_dict[attrs_names[j].toLowerCase()] = String(attrs[i][j]).toLowerCase();
      attributes.push(row_dict);   
    }    

    setCheckboxes(iestudo.checkboxes.states); // initial states
    setEventview(iestudo.eventview); // initial states

    setTable({
        'header' : iestudo.headers, 
        'attributes' : attributes,
        'cells' : iestudo.table,
        'checkboxes' : iestudo.checkboxes.indexes // only rendering information
      });

  },[iestudo]);

  // this should only plot
  // dont mess with state variables only slice/clone them before using  
  function renderTableRows(){    
    const checkboxes_indexes = table.checkboxes.slice();    
    const attributes = table.attributes.slice();
    var rcells = table.cells.map( (arr) => arr.slice() ); 
    var rows = [];   

    checkboxes_indexes.forEach(index => {
      console.info(index, table.cells[index][2], checkboxes[table.cells[index][2]]);
      // Prior checkbox - use 3rd column index 2 to get Process name [key]
      rcells[index][0] = <Cell value={<TinyCheckBox state={checkboxes[table.cells[index][2]]}
          onChange={()=> onChangeCheckbox(table.cells[index][2])} />} />;
      rcells[index][5] = <Cell value={table.cells[index][5]}  
          onClick={() => onChangeShowEvents(table.cells[index][2])}/>; 
    });

    for(let irow=0; irow<rcells.length; irow++) // column of 'Prior' [0] checkboxes and 'Descrição' [5]
      for(let j=0; j<rcells[0].length; j++){
        if( (j!=0 && j!=5) || !checkboxes_indexes.includes(irow) )
          rcells[irow][j] = <Cell value={rcells[irow][j]}/>      
      }

    for(let i=0; i<rcells.length; i++)
      rows.push(<tr key={uuidv4()} {...attributes[i]} >{rcells[i]}</tr>);
    
    return rows;
  }

  if (table && table.header && table.cells)   
    return (<div className='table'>     
            <table>   
              <thead>
                {<tr> {table.header.map((value) => <th key={uuidv4()}>{value}</th> )} </tr>}
              </thead>    
              <tbody>
              {renderTableRows()}
              </tbody>
            </table>
            </div>);
  else
    return <div>Loading...</div>;
}


// $("input[type='checkbox']").click(function(event) {
//   $("body").css("cursor", "progress"); /* wait cursor */               
//   var data = []; 
//   // get state of all checkboxes and update backend for all
//   $("input[type='checkbox']").each(function(i, element) {          
//     parent = element.parentElement.parentElement.getAttribute('group');          
//     data.push([parent, element.checked]); // fill in list/array
//   });
//   fetch("/update_checkbox", {
//     method: "POST",
//     headers: {'Content-Type': 'application/json'}, 
//     body: JSON.stringify(data)
//   }).then(function(response) {
//     $("body").css("cursor", "default"); /* default cursor */
//   });          
// });

function TableAnalysis() {
  const { name } = useParams();
  const [ process, setProcess ] = useState(null); 

  const fmtdname = name.replace('-','/');

  useEffect(() => {
    fetch(`/flask/json`, 
      { headers: { 
        'fast-refresh': 'true' } })
    .then(res => res.json()
    .then(data => {      
      let process_ = data.processos[fmtdname];
      setProcess(process_);  
    }))
    .catch((error) => {      
      console.info(`Error on Table request ${error}`);
    });       
  }, []); // will run only once

  // Must always use conditional rendering to wait for variables loading
  // and definition otherwise Error: `process.prioridade` undefined 
  if (!process)  
    return <div>Loading...</div>;    
  let parent = process.parents ? process.parents[0] : 'None'; // leilão or disponibilidade
  document.title = `${name}`;

  return (
    <>
    <div className="tablecontainer">
      <div className="navbarcontainer">
        <a>Prioridade: { process.prioridade }</a> 
        <a href={`/flask/process?process=${fmtdname}`}> SCM </a> 
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
      <IeTable iestudo={process.iestudo}/>
    </div>
    </>
  );
}

export default TableAnalysis;