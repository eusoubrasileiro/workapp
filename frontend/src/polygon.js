import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function Polygon(){
    const { name } = useParams();
    const fmtdname = name.replace('-','/');
    const [ page, setPage ] = useState(null); 
  
    // /flask/scm/process?process=830.691/2023
    useEffect(() => {
      fetch(`/flask/polygon?process=${fmtdname}`) 
      .then(response => response.text())
      .then(data => {
        setPage(data);
      })
      .catch((error) => {      
        console.info(`Error on scm page request ${error}`);
      });       
    }, []); // will run only once

    if(!page)
      return <>Loading...</>;

    return (
        <div dangerouslySetInnerHTML={{ __html: page }} />
    );

  }

export default Polygon;