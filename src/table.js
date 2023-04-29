import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { clipboardCopyNup, rowStatus } from './utils';

function Table({ processos }) {
  const { name } = useParams();
  const [ table, setTable ] = useState(null);
  
  useEffect(() => {
    document.title = `${name}`;     
    // return () => {  // on unmount component
    // //   window.removeEventListener("beforeunload", Refreshing);
    // }; 
    // console.log(`${list_processos}`);
    // setTable(list_processos[`${name.replace('-','/')}`]['iestudo_table']);
  }, []); 

  if (processos.length == 0) { // conditional rendering otherwise `processos` undefined
    return <div>Loading...</div>;
  } 

  const fmtdname = name.replace('-','/');
  const process = processos[fmtdname];
  console.info(fmtdname);  

  return (
    <>
    <h4>{`${name}`}</h4>
      <div className="container">
       {/*<a>Prioridade: { processos[fmtdname].prioridade }</a> 
        <a href={`/flask/process?process=${fmtdname}`}> SCM </a> 
        <button className="copyprocess" onClick={clipboardCopyNup(processos['NUP'])} > { processos['NUP'] }</button>
         <div> 
            <a>1<sup>st</sup> parent: 
            if dados['parents'] 
            { dados['parents'][0] }
            else 
            { 'None' }
            endif 
            </a> 
        </div>
        <div>
            <a id="iestudo">&#9989;</a>                    
            <a id="iestudo">&#10060;</a>
        </div>      */}
      </div>        
    <div>{`${processos}`}</div> 
    </>
  );
}

export default Table;

// ========================================
// {% else %}    

// {{ pandas_table|safe }}     
// {% endif %}   


//   function fetchTable(){
//     fetch(`${backend_url}/table?selected=${name}`)
//     .then(res => res.json()
//     .then(data => {
//         console.log(`${data}`)
//         setTable(data);      
//     }))
//     .catch((error) => {
//       alert(`Error on fetchTable request ${error}`);
//     });  
//   }


// def htmlTable(table): 
//     """crate a html code for a pretty view of dataframe `table` """
//     # additional columns created for stilying or UI/UX with css, jquery, jscript
//     table = table.copy()
//     table['group'] = table.Processo # which process group it belongs
//     table['evindex'] = None 
//     table['evn'] = None 
//     if 'style' not in table.columns: # legay table or jsons
//         table['style'] = '' # missing column for display porpouses     
//     for _, group in table.groupby(table.Processo):
//         table.loc[group.index, 'evn'] = len(group) 
//         table.loc[group.index, 'evindex'] = list(range(len(group)))
//     table = prettyTabelaInterferenciaMaster(table, view=True)  # some prettify     
//     # for backward compatibility rearrange columns
//     table = table[['Prior', 'Ativo', 'Processo', 'Evento', 'EvSeq', 'Descrição', 'Data', 
//             'DataPrior', 'EvPrior', 'Inativ', 'Obs', 'DOU', 'Dads', 'Sons',
//             'group', 'evindex', 'evn', 'style']] 
//     # rename columns 
//     table.rename(columns={'DataPrior' : 'Protocolo'}, inplace=True)
//     row_attrs = ['Ativo', 'group', 'evindex', 'evn', 'style'] # List of columns add as attributes in each row element.
//     row_cols = table.columns.to_list() # List of columns to write as children in row element. By default, all columns
//     row_cols = [ v for v in row_cols if v not in ['group', 'evindex', 'evn', 'style'] ] # dont use these as columns 
//     html_table = dataframe_to_html(table, row_attrs, row_cols)
//     # insert checkboxes on first row of each process 'Prior' column for click-check prioridade
//     for main_row in html_table.findall(".//tbody/tr[@evindex='0']"):                    
//         if '1' in main_row[0].text:            
//             etree.SubElement(main_row[0], "input", { 'type': 'checkbox', 'checked': ''}) 
//         else:
//             etree.SubElement(main_row[0], "input", { 'type': 'checkbox'})  
//         main_row[0].text = ''   
//     html_table = etree.tostring(html_table, encoding='unicode', method='xml')         
//     return html_table   