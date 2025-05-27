import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fmtProcessName } from './utils';
import { useNavigation, NavigationIndicator } from './navigation.js';

function Scm(){
    const { name } = useParams();
    const [ scmpage, setSCMpage ] = useState(null); 
    const { getCurrentProcessInfo } = useNavigation();
  
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
    }, [name]); // Add name to dependency array

    if(!scmpage)
      return <>Loading...</>;

    return (
        <>
          <NavigationIndicator processInfo={getCurrentProcessInfo(name)} />
          <div dangerouslySetInnerHTML={{ __html: scmpage }} />
        </>
    );
}

export default Scm;