import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, createContext } from 'react';
import PickProcess from "./picker.js";
import Table from "./table.js";

export const DataContext = createContext();
const backend_url = 'http://127.0.0.1:5000' // flask-backend running

export default function App() {
  const [data, setData] = useState([]);
  const [processos, setProcessos] = useState([]);

  function fetchData(fast){
    // fast can be 'true' or 'false'
    fetch(`${backend_url}/json`, 
      { headers: { 'fast-refresh': fast } })
    .then(res => res.json()
    .then(data => {
      setData(data.status);
      setProcessos(data.processos);          
    }))
    .catch((error) => {
      alert(`Error on PickProcess request ${error}`);
    });      
  }

  function slowRefresh(){
    fetchData('false');
  }

  useEffect(() => {
    fetchData('false'); // first call     
    const interval = setInterval(() => { fetchData('true') }, 15000);
    window.addEventListener("beforeunload", slowRefresh);    
    return () => {  // on unmount component
      clearInterval(interval);  // remove the timer
      window.removeEventListener("beforeunload", slowRefresh);
    }; 
  }, []); // will run only once

  if (processos.length === 0) {
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





