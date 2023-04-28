import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

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

  return (
    <>
    <h4>{`${name}`}</h4>
    {/* <ul className="container">
        <li> <a>Prioridade: { processos[name.replace('-','/')]['prioridade'] }</a> </li>
         <li> <a href='/process?process={{ processo }}'>SCM</a> </li> 
        <li> <a>SEI:</a><a class="copyprocess2" href="/copynup" > NUP </a> </li>
        <li> 
            <a>1<sup>st</sup> parent: 
            if dados['parents'] 
            { dados['parents'][0] }
            else 
            { 'None' }
            endif 
            </a> 
        </li>
        <li>
            <a id="iestudo">&#9989;</a>                    
            <a id="iestudo">&#10060;</a>
    </li>     
    </ul>        */}
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