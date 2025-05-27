import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fmtProcessName } from './utils';
import { useNavigation, NavigationIndicator } from './navigation.js';

function Polygon(){
    const { name } = useParams();
    const [ page, setPage ] = useState(null); 
    const { getCurrentProcessInfo } = useNavigation();
  
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
    }, [name]); // Add name to dependency array

    if(!page)
      return <>Loading...</>;

    return (
        <>
          <NavigationIndicator processInfo={getCurrentProcessInfo(name)} />
          <div dangerouslySetInnerHTML={{ __html: page }} />
        </>
    );
}

export default Polygon;