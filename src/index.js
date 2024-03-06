import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PickProcess from "./picker.js";
import TableAnalysis from "./table.js";
import Scm from "./scm.js";
import Polygon from "./polygon.js";


export default function App() {

  return (
    <BrowserRouter>            
       <Routes>
          <Route path="/" element={ <PickProcess/> } />
          <Route path="/table/:name" element={ <TableAnalysis/> } />                 
          <Route path="/scm_page/:name" element={ <Scm/> } />  
          <Route path="/polygon_page/:name" element={ <Polygon/> } />
       </Routes>       
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);





