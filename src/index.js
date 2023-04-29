import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect} from 'react';
import PickProcess from "./picker.js";
import Table from "./table.js";


export default function App() {
  const [data, setData] = useState([]);
  const [processos, setProcessos] = useState({});

  function fetchData(fast){
    // fast can be 'true' or 'false'
    fetch(`/flask/json`, 
      { headers: { 
        'fast-refresh': fast } })
    .then(res => res.json()
    .then(data => {
      setData(data.status);
      setProcessos(data.processos);          
    }))
    .catch((error) => {      
      console.info(`Error on PickProcess request ${error}`);
    });      
  }

  // F5 or refresh causes a slow-refresh
  const slowRefresh = () => fetchData('false');  

  useEffect(() => {
    fetchData('true'); // first call must be fast
    const interval_fast = setInterval(() => { fetchData('true') }, 15000);
    const interval_slow = setInterval(() => { fetchData('false') }, 60000);
    window.addEventListener("beforeunload", slowRefresh);    
    return () => {  // on unmount component
      clearInterval(interval_fast);  // remove the timer
      clearInterval(interval_slow);  // remove the timer
      window.removeEventListener("beforeunload", slowRefresh);
    }; 
  }, []); // will run only once

  if (processos.length == 0) { // conditional rendering otherwise `processos` undefined
    return <div>Loading...</div>;
  } 

  return (
    <BrowserRouter>            
       <Routes>
          <Route path="/" element={ <PickProcess data={data} processos={processos}/>} />
          <Route path="/table/:name" element={ <Table processos={processos}/> } />           
       </Routes>       
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);





