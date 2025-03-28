const Button = ({ onClick, children, style='simple'}) => {
    const buttonStyle = {
        'color': 'white',
        'backgroundColor': '#007bff',  
        'borderColor' : 'white',
        'borderRadius': '0.25rem'                    
      };  
    if(style=='danger'){
        buttonStyle['backgroundColor'] = 'white';
        buttonStyle['color'] = 'red';
        buttonStyle['fontWeight'] = 'bold';
        buttonStyle['fontVariant'] = 'small-caps';
    }
    return (
      <button className='cbutton' style={buttonStyle} onClick={onClick}>
        {children}
      </button>
    );
  };

function clipboardCopy(text) {

    function showAlert(message, duration) {
        // Create alert element
        var alertDiv = document.createElement("div");
        alertDiv.textContent = message;
        alertDiv.style.backgroundColor = "yellow";
        alertDiv.style.padding = "10px";
        alertDiv.style.position = "fixed";
        alertDiv.style.top = "10px";
        alertDiv.style.left = "50%";
        alertDiv.style.transform = "translateX(-50%)";
        alertDiv.style.zIndex = "9999";            
        // Append alert element to body
        document.body.appendChild(alertDiv);            
        // Set timeout to remove alert after specified duration
        setTimeout(function() {
            document.body.removeChild(alertDiv);
        }, duration);
    }
    
    // property doesnt exist if not running from localhost or https    
    if(navigator.clipboard == undefined){
        let duration = 3000;
        showAlert("Clipboard-API copy not supported. Must use localhost. Redirecting in " + duration/1000 + "s", duration);
        setTimeout(function() {
            var portNumber = window.location.port;
            window.location.href = `http://localhost:${portNumber}`;            
        }, duration);            
    }
    else 
        navigator.clipboard.writeText(text).then(() => {
            // Clipboard write succeeded
            console.info("Text copied to clipboard: ", text);
        })
        .catch((error) => {
            // Clipboard write failed or permission denied
            console.error("Error copying text to clipboard: ", error);
        });
}

export { clipboardCopy, Button };