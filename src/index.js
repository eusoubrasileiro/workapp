import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PickProcess from "./picker.js";
import TableAnalysis from "./table.js";


export default function App() {

  return (
    <BrowserRouter>            
       <Routes>
          <Route path="/" element={ <PickProcess/> } />
          <Route path="/table/:name" element={ <TableAnalysis/> } />           
       </Routes>       
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);





