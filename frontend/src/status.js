// New component with state management
import React, { useState, useEffect } from 'react';


function setEstudo(name, done, callback) {
    fetch("/flask/update_estudo_status", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ 'process' : name, 'done' : done })
    }).then(function(response) {
        // $("body").css("cursor", "default"); /* default cursor */
        if (callback) callback(done);
    })
    .catch((error) => {      
        alert(`Error on update_estudo_status request ${error}`);
    });       
  }
  
function estudoStatus(name, dados) {
    console.warn("estudoStatus function is deprecated. Use EstudoStatusButton component instead.");
    if (dados && dados.hasOwnProperty('estudo')) {
      return (
        <a 
          onClick={() => setEstudo(name, !dados.estudo.done)}
          className={`estudo-status-button ${dados.estudo.done ? 'done' : 'pending'}`}
        >
          {dados.estudo.done ? '✅ Concluído' : '⬜ Pendente'}
        </a>
      );
    }
    return (
      <a 
        className="estudo-status-disabled"
      >
        ⛔ Indisponível
      </a>
    );
  }

  
  function EstudoStatusButton({ name, dados }) {
    const [isDone, setIsDone] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    
    // Initialize state from props
    useEffect(() => {
      if (dados && dados.hasOwnProperty('estudo')) {
        setIsDone(dados.estudo.done);
        setIsAvailable(true);
      } else {
        setIsAvailable(false);
      }
    }, [dados]);

    const handleStatusChange = () => {
      // Update local state immediately for better UX
      setIsDone(!isDone);
      // Then update the server
      setEstudo(name, !isDone, (newStatus) => {
        // If needed, sync with server response
        setIsDone(newStatus);
      });
    };

    if (!isAvailable) {
      return (
        <a className="estudo-status-disabled">
          ⛔ Indisponível
        </a>
      );
    }

    return (
      <a 
        onClick={handleStatusChange}
        className={`estudo-status-button ${isDone ? 'done' : 'pending'}`}
      >
        {isDone ? '✅ Concluído' : '⬜ Pendente'}
      </a>
    );
  }
  
  export { EstudoStatusButton };