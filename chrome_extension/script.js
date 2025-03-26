// to work on live-server vscode or chrome using a interferencia page downloaded
// add this bellow to testing page html
// <footer>  <!-- added by me for developing an injection tool -->    
// <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>        
// <script src="script.js"></script>
// <link rel="stylesheet" href="style.css">  
// </footer> 

checked_dict = {}; // get dict of processes marked on database
var study_finished = false;
const backend_url = 'http://127.0.0.1:5000/flask'
const sleep = 400; // sleep between clicks
// navbar to count number of of checkboxes checked and unchecked
const header_html = `
  <div class="navbarcontainer">        
    <div class="navbar">
        <div class="h1">Workapp<div>
        <div class="h1" id="workapp-process-name"> </div>
        <div class="h2">checked 
          <span id="count-checked-checkboxes">0</span>/
          <span id="count-checkboxes">0</span> 
        </div>        
        <div class="h2"> <span id="workapp-finished-study"></span>
        </div>
    </div>
  </div>
`;
var process_name = '';
var isMainPage = document.querySelector("span[class='ant-page-header-heading-title selectorgadget_selected'][title='Página Inicial']") != null;

const estudos_validos = ['1', '8', '21']; // interf, opçao, m. regime com redução
// to make sure we are at r. interferencia page not estudo=1 or estudo=8
// also used for naming the downloaded file
try{
  estudo_number = document.querySelector('body form').getAttribute('action');
  estudo_number = estudo_number.match(/\d{1,2}/)[0]; // get number
}
catch{
  estudo_number = '$$$';  
}
console.log('Is this mainpage:', isMainPage);
console.log('Estudo number', estudo_number);

document.querySelector("body").insertAdjacentHTML("afterbegin", header_html);

function getmainprocess(){
    // Needs aidbag anm estudos work app running on localhost
    try{
      return $("table#ctl00_cphConteudo_gvLowerLeft tbody tr td:first-child")[0].innerText;
    }catch{
      return '';
    }     
}

function highlight_set_checkboxes_prioridade(){

  console.log(`Process in analysis is ${process_name}`)
  process_name = getmainprocess();
  document.title = 'SIG-Áreas['+process_name+']';
  fetch(`${backend_url}/get_prioridade?process=${process_name}`)
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

function finished(){      
  // what a nonsense session Id cookie is inside the document text
  var searchPattern = /sessionId = '([^']*)';/g;
  // it's a vulnerability that might end in the future for sure
  let id = searchPattern.exec(document.documentElement.textContent)[1];       
  cookie = {'ASP.NET_SessionId' : id };
  if(!study_finished){
    fetch(`${backend_url}/estudo_finish`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      // Send cookie as data
      body: JSON.stringify({ 
        cookieData: cookie, 
        process : process_name,
        estudo_number : estudo_number, 
      }),
    })
    .then(response => {
      // Handle response
      study_finished = true;
      if(response.status==400)
        $('#workapp-finished-study').text('NOT FOUND! But file Saved on folder!');
      else
        $('#workapp-finished-study').text('Saved!');
    })
    .catch(error => {
      alert(`Error on estudo_finish request ${error}`);
    });
  }
}



if(estudos_validos.includes(estudo_number) && !isMainPage) 
  $( document ).ready(function() {

    process_name = getmainprocess();
    isMainPage = (process_name == '')? true: false;    

    if(!isMainPage){
      var $checkboxes = $("table#ctl00_cphConteudo_gvLowerRight tbody tr td input[type='checkbox']");
      var total = $checkboxes.length;
      $('#count-checkboxes').text(total);    
      $('#workapp-process-name').text(process_name);    
  
      $checkboxes.change(function(){
        let countCheckedCheckboxes = $checkboxes.filter(':checked').length;
        $('#count-checked-checkboxes').text(countCheckedCheckboxes);
      });

      highlight_set_checkboxes_prioridade();  
      // force refresh of checkboxes navbar
      $checkboxes.change();
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
          finished();   
        }
    };
    

  });






