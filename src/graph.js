import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function Graph() {
  const { name } = useParams();
  const fmtdname = name.replace('-', '/');
  const [imageData, setImageData] = useState(null);

  useEffect(() => {
    fetch(`/flask/graph?process=${fmtdname}`)
      .then(response => response.blob()) // Fetch image data as a blob
      .then(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob); // Convert blob to data URL for rendering
        reader.onloadend = () => setImageData(reader.result);
      })
      .catch((error) => {
        console.error('Error fetching graph:', error);
      });
  }, [name]); // Re-fetch on name change

  if (!imageData) {
    return <div>Loading...</div>;
  }

  return (
    <img src={imageData} alt="Graph" />
  );
}

export default Graph;