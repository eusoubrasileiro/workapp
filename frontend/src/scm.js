import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function Scm(){
    const { name } = useParams();
    const fmtdname = name.replace('-','/');
    const [ scmpage, setSCMpage ] = useState(null); 
  
    // /flask/scm/process?process=830.691/2023
    useEffect(() => {
      fetch(`/flask/scm?process=${fmtdname}`) 
      .then(response => response.text())
      .then(data => {
        setSCMpage(data);
      })
      .catch((error) => {      
        console.info(`Error on scm page request ${error}`);
      });       
    }, []); // will run only once

    if(!scmpage)
      return <>Loading...</>;

    return (
        <div dangerouslySetInnerHTML={{ __html: scmpage }} />
    );

  }

export default Scm;