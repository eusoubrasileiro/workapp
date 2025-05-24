import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fmtProcessName } from './utils';

const nograph_img = "data:image/png;base64,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";

function Graph() {
  const { name } = useParams();
  const [imageData, setImageData] = useState(null);

  useEffect(() => {
    fetch(`/flask/process/${fmtProcessName(name)}/graph`)
      .then(response => {
        if (response.status === 200) {
          return response.blob();
        } else {
          setImageData(nograph_img); // Set default image if no graph is found
          return null;
        }
      })
      .then(blob => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => setImageData(reader.result);
          reader.readAsDataURL(blob);
        }
      })
      .catch((error) => {
        console.error('Error fetching graph:', error);        
      });
  }, [name]);
  
  return (
    <>
    { imageData 
      ? <img src={imageData} alt="Graph" /> 
      : <div>Loading...</div>
    }
    </>
  );
}

export default Graph;