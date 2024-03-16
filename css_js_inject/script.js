// to work on live-server vscode or chrome using a interferencia page downloaded
// add this bellow to testing page html
// <footer>  <!-- added by me for developing an injection tool -->    
// <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>        
// <script src="script.js"></script>
// <link rel="stylesheet" href="style.css">  
// </footer> 

checked_dict = {}; // get dict of processes marked on database
var mainprocess="xxxxxx/2022"; // default to RE-download on SIGAREAS page
var study_finished=false;

const backend_url = 'http://127.0.0.1:5000/flask'

function getmainprocess(){
    // Needs aidbag anm estudos work app running on localhost
    return $("table#ctl00_cphConteudo_gvLowerLeft tbody tr td:first-child")[0].innerText;
}

const sleep = 400; // sleep between clicks

function highlight_set_checkboxes_prioridade(){

  console.log(`Process in analysis is ${mainprocess}`)
  mainprocess = getmainprocess();
  document.title = 'SIG-Áreas['+mainprocess+']';
  fetch(`${backend_url}/get_prioridade?process=${mainprocess}`)
  .then(res => res.json()
  .then( data => { 
    checked_dict = data;
    let sleep_time=sleep; // start 
    if(Object.keys(checked_dict).length === 0 )
      console.warn('No checkbox data. No table?');
    else
      $("table#ctl00_cphConteudo_gvLowerRight tbody tr td label[onclick='IdentificarProcesso(this);']").each(
        function(i, element) { 
            let process = element.innerText;
            element.style.fontWeight = 'bolder';
            element.style.fontStyle = 'oblique';                    
            console.info(`${process} is ${checked_dict[process]}`);
            if(checked_dict[process] == '0'){ // style to red the ones to uncheck
              element.style.color = 'red';
              let checkbox = $(`table#ctl00_cphConteudo_gvLowerRight tbody tr td input[class^="${process}"]`).first()[0];
              console.info(`checkbox is ${checkbox}`);
              if(checkbox.checked){        
                setTimeout(() => checkbox.click(), sleep_time); // uncheck it
                sleep_time += sleep;
              }    
            }
        }
      );
    }))
    .catch((error) => {
      alert(`Erro no helper applet ${error}`);
    });  
}


// to make sure we are at r. interferencia page not estudo=1 or estudo=8
// also used for naming the downloaded file
estudo_type = document.querySelector('body form').getAttribute('action');
estudo_type = estudo_type.match(/\d{1,2}/)[0]; // get number
estudo_type = (estudo_type == '8') ? 'opcao' : (estudo_type == '1') ? 'inter' : 'invalid';

// download Relatorio to download folder
function downloadDocument() {
  let [number, year] = mainprocess.split('/');
  const downloadUrl = `http://sigareas.dnpm.gov.br/Paginas/Usuario/Imprimir.aspx?estudo=1&tipo=RELATORIO&numero=${number}&ano=${year}`;

  const anchorElement = document.createElement('a');
  anchorElement.href = downloadUrl;
  anchorElement.download = `R@&_${number}_${year}_{estudo_type}.pdf`;  
  document.body.appendChild(anchorElement);
  anchorElement.click();
  document.body.removeChild(anchorElement);
}

if(estudo_type == 'interf' || estudo_type == 'opcao') // r. interferencia ou opção
  $( document ).ready(function() {

    let process_name = getmainprocess();
    // navbar to count number of of checkboxes checked and unchecked
    const header_html = `
      <div class="navbarcontainer">        
        <div class="navbar">
            <div class="h1">Workapp<div>
            <div class="h1"> ${process_name} </div>
            <div class="h2"> checked <span id="count-checked-checkboxes">0</span>/<span id="count-checkboxes">0</span> </div>        
        </div>
      </div>
    `;
    document.querySelector("body").insertAdjacentHTML("afterbegin", header_html);  
    var $checkboxes = $("table#ctl00_cphConteudo_gvLowerRight tbody tr td input[type='checkbox']");
    var total = $checkboxes.length;
    $('#count-checkboxes').text(total);    
    $checkboxes.change(function(){
      let countCheckedCheckboxes = $checkboxes.filter(':checked').length;
      $('#count-checked-checkboxes').text(countCheckedCheckboxes);
    });

    highlight_set_checkboxes_prioridade();

  // adding callback to update on database when estudo is finished 9th and 10th tr on toolbar
  document.onmousedown = function (event) {
    if (!event) {event = window.event;}
    // console.info("mousedown  target is "+ event.target + " target parent is " + event.target.parentElement + " parent attributes");
    parent_id = event.target.parentElement.getAttribute("id")
    console.log("parent id attribute " + parent_id);
    if (!study_finished && 
        ( parent_id == 'ctl00_cphConteudo_Toolbar1GerarRelatorio' ||
          parent_id == 'ctl00_cphConteudo_Toolbar1FinalizarEstudo') 
        ){
        // make database know this estudo is finished
        fetch(`${backend_url}/iestudo_finish?process=${mainprocess}`).then((response) =>{          
          study_finished = true; 
          downloadDocument();  
        });
      }
  };

  function finished(){
    if(!study_finished){
      fetch(`${backend_url}/iestudo_finish?process=${mainprocess}`); // make database know this estudo is finished
      // Call the download function
      downloadDocument();      
    }
  }

    // didn't load list of checkbox reload it on ENTER
    $(document).keypress(function(e) { 
      if(e.key == 'Enter') {
        highlight_set_checkboxes_prioridade();
      }
      if(e.key == 'r') {
        finished();
      }      
    });

    // force refresh of checkboxes navbar
    $checkboxes.change();

  });
else{ // to show on sigareas page - to know it
  let interf_page_check = $('span#ctl00_cphConteudo_lblTitulo');

    const header_html = `
    <div class="navbarcontainer">
      <div class="navbar">
        <div class="h1">Workapp<div>         
      </div>
    </div>
  `;
    document.querySelector("body").insertAdjacentHTML("beforeend", header_html);  
}

// Re-Download last study on 'R' press
// don't update study finished tough
$(document).keypress(function(e) {   
  if(e.key == 'r') {
    downloadDocument();
  }
  // TODO: warn backend to parse pdf and then
  // move it to the proper place also updating finesh status
});



