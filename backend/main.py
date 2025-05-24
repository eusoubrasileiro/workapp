"""
Flask app to analyse interferencia table 
and save it's 'prioridade' results direct from browser.add()
Run from ~/Projects 
python -m workapp.main
or to run on background
nohup python -m workapp.main
"""
import mimetypes
import sys, pathlib, os 
import pandas as pd 
import copy
from bs4 import BeautifulSoup as soup 
from flask_session import Session
from flask_cors import CORS
from flask import (
        Flask, 
        request, 
        Response,
        send_from_directory
    )
from aidbag.anm.config import config
from aidbag.anm.careas import estudos
from aidbag.anm.careas.workflows import (
    work,
    ProcessPathStorage,
    currentProcessGet,
    processPath
)
from aidbag.anm.uid import Pud
from aidbag.anm.careas.scm import (
    ProcessManager,
    ancestry,
    db  
    )
from aidbag.anm.careas.estudos.interferencia import (
        Interferencia, 
        prettyTableStr
    )

if os.environ.get('APP_ENV') == 'production':
    app = Flask(__name__, 
    static_url_path='',
    static_folder='./build')
else:
    app = Flask(__name__)

# need CORS on 2 cases
# 1. to allow the anm domain (js,html injection) request this app on localhost
# 2. development mode when frontend is run by nodejs
CORS(app) # This will enable CORS for all routes
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 3600  # STATIC files cache timeout in seconds
# Flask-Session package - every client has a client data store on filesystem
app.config['SESSION_TYPE'] = 'filesystem' # store session data on filesystem
app.config['PERMANENT_SESSION_LIFETIME'] = 15*60 # The session will expire delete files in folder after this time
app.config['SESSION_FILE_DIR'] = pathlib.Path.home() / pathlib.Path(".workapp/session") # The directory where session files are stored.
Session(app)

# routes for development or production
if os.environ.get('APP_ENV') == 'production':
    # Serving 'production' React App from here flask
    # Update static folder path to point to the new build location
    frontend_build_path = pathlib.Path(__file__).parent.parent / 'frontend' / 'build'
    app.static_folder = str(frontend_build_path)
    
    @app.errorhandler(404) # pages not found direct to react/index.html/javascript bundle
    @app.route('/')
    def index(e=None):
        return app.send_static_file('index.html')

    @app.route('/<path:path>')
    def static_proxy(path):
        return app.send_static_file(path)
else:
    @app.route('/')
    def index():
        return "In development mode!<br> RUN `npm start` from workapp project folder"


def uiTableData(table: pd.DataFrame) -> dict: 
    """
    From a pandas dataframe table create additional columns to be send as JSON.
    So the frontend in React can create the table 'UI' (user interface) and the
    interactiveness using javascript, html and css (styling) etc.
    """
    # additional columns created for stilying or UI with css, jquery, jscript
    if table is None: 
        return None 
    table = table.copy()
    table['evindex'] = None # index of event in row of events
    table['evn'] = None   # number of rows of events
    for _, group in table.groupby(table.Processo):
        table.loc[group.index, 'evn'] = len(group) 
        table.loc[group.index, 'evindex'] = list(range(len(group)))     
    if 'Popc' not in table.columns: # backward compatibility when there was no 'Popc' column
        table['Popc'] = False
    # for backward compatibility rearrange columns
    table = table[['Prior', 'Ativo', 'Processo', 'Evento', 'EvSeq', 'Descrição', 'Data', 
            'EvPrior', 'Inativ', 'Obs', 'DOU', 'Dads', 'Sons',
            'evindex', 'evn', 'Popc']]     
    if 'EvSeq' in table.columns:
        table.rename(columns={'EvSeq' : '#'}, inplace=True)    
    row_attrs = ['Ativo', 'evindex', 'evn', 'Inativ', 'EvPrior', 'Popc'] # List of columns add as attributes in each row element.
    row_cols = table.columns.to_list() # List of columns to write as children in row element. By default, all columns
    row_cols = [ v for v in row_cols if v not in ['evindex', 'evn', 'Inativ', 'EvPrior', 'Popc'] ] # don't display these columns 
    table_pretty = prettyTableStr(table)  # some prettify
    # States information using pretty table (checkboxes, eventview)
    query = table_pretty.query("Prior != ''")[['Processo', 'Prior']]
    checkboxes = { tp.Processo: True if (tp.Prior=='1') else False  for (i,tp) in query.iterrows()}
    eventview = { tp.Processo: True for (i,tp) in query.iterrows()} # create default view all
    indexes = query.index.values.astype(str)
    groups = list(zip(indexes[:-1],indexes[1:]))
    # process group rows indexes start/end  - orders matters to jscript so must be list not dict 
    groupindexes = list(zip(query.Processo, groups+[[indexes[-1],str(table_pretty.shape[0])]]))
    states = {'checkboxes' : checkboxes, 'eventview' : eventview, 'groupindexes' : groupindexes}
    dictTable = {
        'table' : table_pretty[row_cols].values.tolist(), 
        'headers' : row_cols,
        'attrs' : table[row_attrs].values.tolist(), # columns of attributes for styling or interactivity
        'attrs_names' : row_attrs, # column names of attributes above
        'states': states # priority or not checked  processes
    }
    return dictTable

@app.route('/flask/process/<process>/analyze', methods=['GET'])
def startTableAnalysis(process):
    dbdata = ProcessManager[process].dados
    table_pd = None # pandas table
    # to update-add process|database start by default not done now
    if 'estudo' in dbdata:
        if 'table' in dbdata['estudo'] and dbdata['estudo']['table']: # from database        
            table_pd = pd.DataFrame.from_dict(dbdata['estudo']['table'])                
    else: # from legacy excel   
        try:
            print(f"{dbdata['NUP']} Not using database json! Loading from legacy excel table.", file=sys.stderr)
            estudo = Interferencia.from_excel(ProcessPathStorage[process])        
            table_pd = prettyTableStr(estudo.tabela_interf_master, view=False)
        except RuntimeError:
            table_pd = None    
    # make the payload data for javascript   
    jsdata = copy.deepcopy(dbdata) 
    jsdata['prioridade'] = dbdata['prioridade'].strftime("%d/%m/%Y %H:%M:%S") # better date/view format    
    if 'prioridadec' in dbdata:
        jsdata['prioridadec'] = dbdata['prioridadec'].strftime("%d/%m/%Y %H:%M:%S") # better date/view format 
    if table_pd is not None:      
        # those are payload data dont mistake it with the real dados dict saved on database                
        tabledata = uiTableData(table_pd)
        # it's overwriting on jsdata['estudo]['table'] that came from database
        jsdata['estudo']['table'] = tabledata['table'] # table data as list != from database as dict                             
        jsdata['estudo']['headers'] = tabledata['headers'] # columns for display           
        jsdata['estudo']['attrs'] = tabledata['attrs'] # columns for styling
        jsdata['estudo']['attrs_names'] = tabledata['attrs_names'] # names of columns for styling
        # states will be saved/updated on DB when onClick or onChange
        if not 'states' in dbdata['estudo']:
            jsdata['estudo']['states'] = tabledata['states'] 
            # ONLY: 'states' and table_pd (pandas dict) are saved/updated on database dados['estudo] dict   
            # deepcopy is avoiding dbdata linked to jsdata dict - add without groupindexes       
            dbdata['estudo']['states'] = copy.deepcopy(tabledata['states'] )  
        # database saves table as dataframe ->dict != from prettyfied pandas jsdata json-list           
        dbdata['estudo']['table'] = table_pd.to_dict()            
    # react receives main table data as `dataframe.values.tolist()`
    # but database data is 'dict' not 'list' so must be converted    
    ProcessManager[process].update({'estudo' : dbdata['estudo']})      
    return jsdata 


@app.route('/flask/work/list', methods=['POST'])
def getProcessos():           
    """get list of processos from database"""
    sort = request.json.get('sorted')    
    # could implement lazy load for updating only the dados part after 
    # but 1s delay is not a problem
    processos = [] 
    for process_name in currentProcessGet():    
        process = ProcessManager[process_name]
        if process:
            dados = process.dados
        else: # None - not found
            dados = {} # return empty dictionary 
        processos.append({ 'name' : process_name, 'data' : dados})  

    if sort:        
        print(f'sort {sort}', file=sys.stderr)
        match sort:            
            case 'error':                
                processos = sorted(processos, key=lambda item: 
                    item['data']['prework']['error'] if 'error' in item['data']['prework'] else '')
            case 'type':
                processos = sorted(processos, key=lambda item: 
                    item['data']['tipo'] if 'tipo' in item['data'] else '')
            case 'name':
                processos = sorted(processos, key=lambda item: 
                    Pud.parse(item['name']).unumber if 'name' in item else '', reverse=True)
    return { 
            'processos' : processos,
            'status'    : { 
                'workfolder' : config['processos_path'],
                'published'  : db.count_published_current_month()
                }
            }


def updatedb(name, data, what='eventview', save=False):    
    """update cached estudo table and estudo file on database DADOS column"""        
    estudo = {}
    dados = ProcessManager[name].dados # a copy
    if 'estudo' in dados:
        estudo = dados['estudo'] 
        if 'checkboxes' in what:            
            estudo['states'].update({'checkboxes' : data })
        elif 'eventview' in what:
            estudo['states'].update({'eventview' : data })    
        # add or update ['estudo'] fields key  
        ProcessManager[name].update({'estudo' : estudo})  


@app.route('/flask/update_checkbox', methods=['POST'])
def update_checkbox():
    payload = request.get_json() 
    updatedb(payload['name'], payload['data'], 'checkboxes')    
    return Response(status=204)     


@app.route('/flask/update_eventview', methods=['POST'])
def update_collapse():
    payload = request.get_json()  
    updatedb(payload['name'], payload['data'], 'eventview')     
    return Response(status=204)


#like /flask/redo?process=830.691/2023
@app.route('/flask/process/<process>/redo', methods=['GET'])
def redo(process):
    """redo interferência"""
    process = ProcessManager[process]    
    if process is not None:
        dados = process.dados
        # if 'estudo' in dados:
        #     estudo = dados['estudo']          
        #     # if estudo['type'] == 'interferencia':
    print(f'remaking process {process}', file=sys.stderr)          
    estudos.Interferencia.make(process, overwrite=True)
    return process.dados


# like /flask/process/830.691-2023/scm
@app.route('/flask/process/<process>/scm', methods=['GET'])
def scm_page(process):
    """return scm page stored only the piece with processo information"""
    print(f'process is {process}', file=sys.stderr)
    process = ProcessManager[process]
    if process is None:
        return Response(status=404)
    html_content = process.basic_html
    sp = soup(html_content, "html.parser")
    res = sp.select('body form div table table:nth-child(3)')[0]    
    return str(res)

# like /flask/process/830.691-2023/polygon
@app.route('/flask/process/<process>/polygon', methods=['GET'])
def poly_page(process):
    """return scm polyogon page stored only the piece with processo information"""
    print(f'process is {process}', file=sys.stderr)
    process = ProcessManager[process]
    if process is None:
        return Response(status=404)
    html_content = process.polygon_html
    sp = soup(html_content, "html.parser")
    res = sp.select('body form div table table:nth-child(3)')[0]    
    return str(res)

# like /flask/process/830.691/2023/graph
@app.route('/flask/process/<process>/graph', methods=['GET'])
def graph(process):
    print(f'process is {process}', file=sys.stderr)
    process = ProcessManager[process]    
    if process is not None:
        dados = process.dados
        if('associados' in dados and 
           'graph' in dados['associados'] and 
            dados['associados']['graph']): # not empty
            buffer = ancestry.plotDirectGraphAssociados(
                    ancestry.pGraph(process['associados']['graph']),
                    False)
            return  Response(buffer.getvalue(), 
                            mimetype='image/png')  # Adjust mimetype as needed
    return Response(status=204)

@app.route("/flask/process/<process>/files/<filename>", methods=['GET'])
def process_serve_file(process, filename):
    path = processPath(Pud.parse(process)) / filename
    return send_from_directory(path)

@app.route("/flask/process/<process>/files", methods=['GET'])
def process_files(process):
    folder = processPath(Pud.parse(process))
    results = []
    for path in folder.rglob("*"):               # recursive; use .iterdir() for flat
        rel = path.relative_to(folder).as_posix()
        stat = path.stat()
        results.append({
            "path": rel,
            "is_dir": path.is_dir(),
            "size": stat.st_size,
            "mtime": int(stat.st_mtime),
            "mime": mimetypes.guess_type(path.name)[0] if path.is_file() else None,
        })
    return results


#
# routines used by the `chrome extension` sigareas-helper 
#

@app.route('/flask/get_prioridade', methods=['GET'])  # like /get_prioridade?process=830.691/2023
def get_prioridade():
    """return list (without dot on name) of interferentes with process if checked-market or not for use on chrome extension"""
    key = request.args.get('process')    
    print(f'chrome extension process is {key}', file=sys.stderr)
    pobj = ProcessManager[key]
    states =  pobj.get('estudo', 'states', 'checkboxes')     
    if states:
        # turn in acceptable javascript format for processes - otherwise wont work 
        # here 1. no dots 2. no leading zeros 
        def fmtPnameJs(name):
            num, year = Pud.parse(name).numberyear
            return '/'.join([str(int(num)),str(int(year))])        
        return { fmtPnameJs(key) : value for key, value in states.items() } # remove dot for javascript use
    # return this in case opção de área
    print(f'chrome extension process is {key} did not find checkboxes states. \n TODO implement Opção/Table checkbox', file=sys.stderr)
    return {}

@app.route('/flask/update_estudo_status', methods=['POST'])
def update_estudo_status():
    """update estudo status on database"""
    key = request.json.get('process')
    done = request.json.get('done')
    print(f'update_estudo_status {key} {done}', file=sys.stderr)
    process = ProcessManager[key] 
    if process is None:
        return Response(status=404)
    if process.get('estudo'):
        process.set('estudo.done', done)
    return Response(status=204)


@app.route('/flask/estudo_finish', methods=['POST'])  
def estudo_finish():
    """
    chrome extension helper tool
     * reports estudo finished
     * moves estudo pdf to process folder
       uses config doc prefix
    """
    print(f'estudo_finish request.json {request.json}', file=sys.stderr)
    fullProcessName = request.json.get('fullProcessName') # NUP e.g.     
    etype = request.json.get('estudoType')  
    keyfound = work.estudoFinish(fullProcessName, etype)
    if keyfound:
        return Response(status=204)
    else:
        print(f'process {fullProcessName} not found - but file saved on folder', file=sys.stderr)
        return Response(status=404)
    


