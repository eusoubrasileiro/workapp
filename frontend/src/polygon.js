import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fmtProcessName } from './utils';

function Polygon(){
    const { name } = useParams();
    const [ page, setPage ] = useState(null); 
  
    // /flask/process/830.691-2023/polygon
    useEffect(() => {
      fetch(`/flask/process/${fmtProcessName(name)}/polygon`) 
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