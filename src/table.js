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

function Cell({key_, value, onClick}){ // undefined is the default if not set
   return (
    <td key={key_} onClick={onClick}>{value}</td>
  );
}


// TODO href on scm process on table
// $("tr[evindex='0']:not([evn='1']) td:nth-child(3)").wrap(function() {        
//   return "<a href='/process?process="+$(this).text()+"'/></a>";
// });

function IeTable({studyname, iestudo}){
  // arrays of same size for checkboxes and showevents states  
  const [ table, setTable] = useState({});
  const [ checkboxes, setCheckboxes] = useState({});
  const [ eventview, setEventview] = useState({});

  function onChangeCheckbox(name){ 
    console.info('onChangeCheckbox ' + name);
    let checkboxes_ = {...checkboxes}; // old state
    checkboxes_[name] = !checkboxes_[name];    
    setCheckboxes(checkboxes_);

    fetch("/flask/update_checkbox", {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ 'name' : studyname, 'data' : checkboxes_ })
    }).then(function(response) {
      // $("body").css("cursor", "default"); /* default cursor */
    });          

  } 

  function onChangeShowEvents(name){ 
    console.info('onChangeShowEvents ' + name);
    let eventview_ = {...eventview}; // old state
    eventview_[name] = !eventview[name];    
    setEventview(eventview_);

    fetch("/flask/update_eventview", {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ 'name' : studyname, 'data' : eventview_ })
    }).then(function(response) {
      // $("body").css("cursor", "default"); /* default cursor */
    });   

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

    setTable({
        'header' : iestudo.headers, 
        'attributes' : attributes,
        'cells' : iestudo.table,
        'groupindexes' : iestudo.states.groupindexes, // only rendering information        
      });

  },[iestudo]);

  // this should only plot
  // dont mess with state variables only slice/clone them before using  
  function renderTableRows(){        
    const attributes = table.attributes.slice();
    var rcells = table.cells.map( (arr) => arr.slice() ); 
    var rows = [];          
    
    // add c0 or c1 class to group of process rows
    Object.entries(table.groupindexes).forEach(([name, indexes], index) =>{       
      let [start, end] = indexes.map(item => Number(item));
      console.info('name ... index', name, start, end, index);  
      for(let i=start; i<end; i++)
         attributes[i] = Object.assign(attributes[i], {className : `c${index%2}`});
    });

    let headindexes = Object.values(table.groupindexes).map((element) => {
      return Number(element[0]);
    });
    
    // console.info('headindexes', headindexes);
    for(let i=0; i<rcells.length; i++) 
      for(let j=0; j<rcells[0].length; j++){
        if(headindexes.includes(i) && (j==0||j==5)){                    
          let name = table.cells[i][2];
          //console.info('checkboxes:', irow, name, checkboxes[name]);
          switch(j){
            case 0: // 'Prior' checkbox - use 3rd column index 2 to get Process name [key]          
              rcells[i][0] = <Cell key_={`k${(i)}x${j}`} value={<TinyCheckBox state={checkboxes[name]}
                onChange={() => onChangeCheckbox(name)}/>}/>;
              break;
            case 5: // 'Descrição' [5] - add event view change handler
              rcells[i][5] = <Cell key_={`k${(i)}x${j}`} value={table.cells[i][5]}  
                onClick={() => onChangeShowEvents(name)}/>; 
              break;
          }
        }
        else
          rcells[i][j] = <Cell key_={`k${(i)}x${j}`} value={rcells[i][j]}/>      
      }
    // console.warn('rows', JSON.stringify(rcells));
    let row_hide = []
    // remove event lines from rcells on creating <tr> rows
    Object.entries(eventview).forEach( ([name, state]) => {
      if(!state){ // if state is False remove event lines from that name process from table
          let [start, end] = table.groupindexes[name];
          for(let i=Number(start)+1; i<Number(end); i++) // remove all rows in ]start, end[
            row_hide.push(i);
      }
    });        

    let row_indexes =  Array.from(Array(attributes.length).keys()).filter((item) => !row_hide.includes(item));    
    // console.info('row_indexes after', row_indexes);
    row_indexes.forEach((i) => 
      rows.push(<tr key={uuidv4(rcells[i])} {...attributes[i]} >{rcells[i]}</tr>)      
    );

    
    return rows;
  }

  if (table && table.header && table.cells && studyname)   
    return (<table>   
              <thead>
                {<tr>{table.header.map((value) => <th key={value}>{value}</th> )}</tr>}
              </thead>    
              <tbody>
              {renderTableRows()}
              </tbody>
            </table>);
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
      <IeTable studyname={fmtdname} iestudo={process.iestudo}/>
    </div>
    </>
  );
}

export default TableAnalysis;