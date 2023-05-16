
function rowStatus(dados) {
    if (dados.hasOwnProperty('iestudo')) {
        if (dados.iestudo.done)
            return <a>&#9989;</a>

        else
            return <a>&#x23F3;</a>
    }
    else
        return <a>&#10060;</a>
}
  
function clipboardCopy(text) {
    // property doesnt exist if not running from localhost or https 
    // TODO: check -> window.isSecureContext and alert      
    if(navigator == undefined)
        alert("must use localhost as domain name");
    else 
        navigator.clipboard.writeText(text);
}


export { rowStatus, clipboardCopy };