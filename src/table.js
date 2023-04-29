import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { clipboardCopy, rowStatus } from './utils';

function Table({processos}) {
  const { name } = useParams();
  const [ table, setTable ] = useState(null);  
  
  useEffect(() => {
    document.title = `${name}`;
  }, [name]); 

  if (processos.length == 0)  // conditional rendering otherwise `processos` undefined
    return <div>Loading...</div>;  

  let fmtdname = name.replace('-','/');
  let process = processos[fmtdname];  
  let parent = process.parents ? process.parents[0] : 'None'; // leilão or disponibilidade
  //make table   

  return (
    <>
    <div className="container">
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
    <div>{`${process.NUP}`}</div> 
    </>
  );
}

export default Table;

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