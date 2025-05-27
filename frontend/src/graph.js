import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fmtProcessName } from './utils';
import { useNavigation, NavigationIndicator } from './navigation.js';


function Graph() {
  const { name } = useParams();
  const [imageData, setImageData] = useState(null);
  const [hasGraph, setHasGraph] = useState(false);
  const { getCurrentProcessInfo } = useNavigation();  

  useEffect(() => {
    fetch(`/flask/process/${fmtProcessName(name)}/graph`)
      .then(response => {
        if (response.status === 200) {
          return response.blob();
        } else {
          setHasGraph(false);
          return null;
        }
      })
      .then(blob => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => setImageData(reader.result);
          reader.readAsDataURL(blob);
          setHasGraph(true);
        }
      })
      .catch((error) => {
        console.error('Error fetching graph:', error);        
      });
  }, [name]);

  return (
    <>
      <NavigationIndicator processInfo={getCurrentProcessInfo(name)} />
      { hasGraph 
        ? <img src={imageData} alt="Graph" /> 
        : <div>No graph found</div>
      }
    </>
  );
}

export default Graph;