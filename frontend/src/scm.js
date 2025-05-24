import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fmtProcessName } from './utils';

function Scm(){
    const { name } = useParams();
    const [ scmpage, setSCMpage ] = useState(null); 
  
    // /flask/scm/process?process=830.691/2023
    useEffect(() => {
      fetch(`/flask/process/${fmtProcessName(name)}/scm`) 
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