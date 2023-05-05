import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { clipboardCopy, rowStatus } from './utils';
import { v4 as uuidv4 } from 'uuid';


function TinyCheckBox({state, Changed}){  
  return (
    <input type='checkbox' checked={state} onChange={Changed}>
    </input>
  );
}

function Cell({value, onClick}){ // undefined is the default if not set
   return (
    <td key={uuidv4()} onClick={onclick}>{value}</td>
  );
}


function IeTable({iestudo}){
  // arrays of same size for checkboxes and showevents states
  const [ checkboxes, setCheckboxes] = useState([]);
  const [ showevents, setShowEvents] = useState([]); 
  // const [ rows, setRows] = useState([]);

  function onChangeCheckbox(i){ 
    console.info('onChangeCheckbox ' + i);
  }

  function onChangeShowEvents(i){ 
    console.info('onChangeShowEvents ' + i);
  }

  // // call createTable
  // createTable(process.iestudo);
  // setCheckboxes([Array(parseInt(process_.iestudo.nprocs)).fill(true)]);
  // setShowEvents([Array(parseInt(process_.iestudo.nprocs)).fill(true)]);

  

  const nprocess = iestudo.nprocess;  
  const nrows = iestudo.nrows;  
  const object_table = iestudo.table;
  // Converts object to an html <table>         
  // * row_attrs (list, optional): List of columns to write as attributes in <tr> row element. Defaults to [] none.
  // * row_cols (list, optional): List of columns to write as children in row <td> element. Defaults to all columns.                   
  const row_attrs = ['Ativo', 'group', 'evindex', 'evn', 'display'];    
  const order = ['Prior', 'Ativo', 'Processo', 'Evento', 'EvSeq', 'Descrição', 'Data', 
          'Protocolo', 'EvPrior', 'Inativ', 'Obs', 'DOU', 'Dads', 'Sons',
          'group', 'evindex', 'evn', 'display'];    
  var array_table = []
  // create array from object so table columns are properly ordered
  for(let i=0; i<order.length; i++)
    array_table.push([order[i], object_table[order[i]]]);
  const row_cols  = order.filter((v) => ! row_attrs.includes(v) );          
  // header of table - copy column names  
  const header = row_cols.slice(0).map((value) => <th key={uuidv4()}>{value}</th> );  
  // 2D array of cells on table
  const ncol = row_cols.length;
  //const cells = new Array(nrows*ncol).fill(null);
  const cells = new Array(nrows).fill(0).map(() => new Array(ncol).fill(null));
  // rows array 
  var rows = new Array(nrows).fill(null);
  // get process group name from row number
  const getGroup = (i) => object_table.group[i];    
  // invert the inverted table 
  for(let irow = 0; irow < nrows; irow++){      
    let attributes = {}; // single row attributes        
    for(let j=0; j<order.length; j++){
      let [name, dict] = array_table[j]; // ordered column dicts
      // console.info('dict is ' + dict + ' name is ' + name + ' i ' + irow + ' j ' + j);                  
      if(!row_attrs.includes(name)){     
        switch (name){          
          case 'Descrição': // show events change event
            cells[irow][j] = 
              <Cell value={dict[irow]} onClick={() => onChangeShowEvents(getGroup(irow))}/>;
            break;           
          case 'Prior':              
            if(array_table[15][1][irow] == '0'){ // checkbox only 'evnindex'==0 (column 16-1)
              let checked = (dict[irow]=='-1')?false:true;
              //setCheckboxes(); // will case a re-render infinite loop - should be on useEffect
              cells[irow][j] = <Cell 
                value={<TinyCheckBox state={checked} onChange={()=> onChangeCheckbox(getGroup(irow))} />} />;
            }
            else{
              cells[irow][j] = <Cell value={dict[irow]}/>;
            }
            break;           
          default:
            cells[irow][j] = <Cell value={dict[irow]}/>;
        }
      }
      else{ // if display column : should convert to javascript object first
        if(name == 'display'){ // display row info turn in style = "display : none"
          let display = (dict[irow] == 'false') ? 'none' : '';
          attributes['style'] = {'display' : display};
        }
        else 
          attributes[name.toLowerCase()] = dict[irow].toLowerCase();         
      }    
    }
    rows.push(<tr {...attributes} key={irow*7-1}>{cells[irow]}</tr>);  
  }

  // var columns = [];        
  // Object.entries(object_table).forEach(([name, dict])=> { // go through columns          
  //   let column = [];
  //   console.info(name);
  //   console.info(dict);            
  //   column.push(<div>{name}</div>); // header of column
  //   Object.values(dict). // column values
  //     forEach((value) => { column.push(<div>{value}</div>); });
  //     //console.info(column);  
  //     //columns.push(<div className='tablecolumn'>{column}</div>);                        
  // });
  // console.info(columns);
  // rows.push(<tr>{column}</tr>)
  return (<div className='table'>     
          <table>   
            <thead>
              <tr>{header}</tr>
            </thead>    
            <tbody>
            {rows}
            </tbody>
          </table>
          </div>);
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