"""
Flask app to analyse interferencia table 
and save it's 'prioridade' results direct from browser.add()
Run from ~/Projects 
python -m workapp.main
or to run on background
nohup python -m workapp.main
"""
import sys, pathlib, shutil, os 
import threading
import time
import pandas as pd 
import argparse
import datetime
import copy

from flask_cors import CORS
from flask_caching import Cache
from flask import (
        Flask, 
        request, 
        Response,
        send_from_directory
    )

from aidbag.anm.careas import config
from aidbag.anm.careas import workflows as wf 
from aidbag.anm.careas.scm import ProcessManager
from aidbag.anm.careas.scm.util import (
    fmtPname,
    numberyearPname
    )
from aidbag.anm.careas.estudos.interferencia import (
        Interferencia, 
        prettyTabelaInterferenciaMaster
    )

app = Flask(__name__, 
    static_url_path='',
    static_folder='./build')

# to allow the anm domain (js,html injection) request this app on localhost
CORS(app) # This will enable CORS for all routes
app.config['CACHE_DEFAULT_TIMEOUT'] = 31536000 # 1 year of cache
# Flask-Cache package
app.config['CACHE_THRESHOLD'] = 10000
# cache directory - making a temporary directory that don't gets erased timely
app.config['CACHE_DIR'] = pathlib.Path.home() / pathlib.Path(".workapp/cache") 
app.config['CACHE_TYPE'] = 'FileSystemCache' 
cache = Cache(app)

def uiTableData(table): 
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
    # for backward compatibility rearrange columns
    table = table[['Prior', 'Ativo', 'Processo', 'Evento', 'EvSeq', 'Descrição', 'Data', 
            'EvPrior', 'Inativ', 'Obs', 'DOU', 'Dads', 'Sons',
            'evindex', 'evn']]     
    if 'EvSeq' in table.columns:
        table.rename(columns={'EvSeq' : '#'}, inplace=True)    
    row_attrs = ['Ativo', 'evindex', 'evn', 'Inativ'] # List of columns add as attributes in each row element.
    row_cols = table.columns.to_list() # List of columns to write as children in row element. By default, all columns
    row_cols = [ v for v in row_cols if v not in ['evindex', 'evn', 'Inativ'] ] # don't display these columns 
    table_pretty = prettyTabelaInterferenciaMaster(table, view=True)  # some prettify
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

@app.route('/flask/analyze', methods=['POST'])
def startTableAnalysis():
    name = request.get_json()['name']     
    dbdata = ProcessManager.getDados(name)
    table_pd = None # pandas table
    # to update-add process|database start by default not done now
    if 'iestudo' not in dbdata:
        dbdata['iestudo'] = {'done' : False, 'time' : datetime.datetime.now() }
    if 'iestudo' in dbdata and 'table' in dbdata['iestudo']: # from database        
        table_pd = pd.DataFrame.from_dict(dbdata['iestudo']['table'])        
    else: # from legacy excel   
        try:
            print(f"{dbdata['NUP']} Not using database json! Loading from legacy excel table.", file=sys.stderr)
            estudo = Interferencia.from_excel(wf.ProcessPathStorage[name])        
            table_pd = prettyTabelaInterferenciaMaster(estudo.tabela_interf_master, view=False)
        except RuntimeError:
            table_pd = None    
    # make the payload data for javascript   
    jsdata = copy.deepcopy(dbdata) 
    jsdata['prioridade'] = dbdata['prioridade'].strftime("%d/%m/%Y %H:%M:%S") # better date/view format    
    if table_pd is not None:      
        # those are payload data dont mistake it with the real dados dict saved on database                
        tabledata = uiTableData(table_pd)
        # it's overwriting on jsdata['iestudo']['table'] that came from database
        jsdata['iestudo']['table'] = tabledata['table'] # table data as list != from database as dict                             
        jsdata['iestudo']['headers'] = tabledata['headers'] # columns for display           
        jsdata['iestudo']['attrs'] = tabledata['attrs'] # columns for styling
        jsdata['iestudo']['attrs_names'] = tabledata['attrs_names'] # names of columns for styling
        # states will be saved/updated on DB when onClick or onChange
        if not 'states' in dbdata['iestudo']:
            jsdata['iestudo']['states'] = tabledata['states'] 
            # ONLY: 'states' and table_pd (pandas dict) are saved/updated on database dados['iestudo'] dict   
            # deepcopy is avoiding dbdata linked to jsdata dict - add without groupindexes       
            dbdata['iestudo']['states'] = copy.deepcopy(tabledata['states'] )  
        # database saves table as dataframe ->dict != from prettyfied pandas jsdata json-list           
        dbdata['iestudo']['table'] = table_pd.to_dict()            
    # react receives main table data as `dataframe.values.tolist()`
    # but database data is 'dict' not 'list' so must be converted
    
    # add or update ['iestudo'] fields key
    ProcessManager.updateDados(name, 'iestudo', dbdata['iestudo'])      
    return jsdata 

def backgroundUpdate(sleep=5):
    """Thread running on background updating cached dictionary every sleep seconds"""    
    processos = {} 
    while True:  
        processos.clear()
        for process in wf.currentProcessGet():    
            processos.update({process : ProcessManager.getDados(process)})  
        cache.set('processos_dict', processos)   
        time.sleep(sleep)    

@app.route('/flask/list', methods=['GET'])
def getProcessos():       
    return { 
            'processos' : cache.get('processos_dict'),
            'status'    : { 
                'workfolder' : config['processos_path']
                }
            }

def updatedb(name, data, what='eventview', save=False):    
    """update cached estudo table and estudo file on database DADOS column"""        
    iestudo = {}
    dados = ProcessManager.getDados(name) # a copy
    if 'iestudo' in dados:
        iestudo = dados['iestudo'] 
        if 'checkboxes' in what:            
            iestudo['states'].update({'checkboxes' : data })
        elif 'eventview' in what:
            iestudo['states'].update({'eventview' : data })    
        # add or update ['iestudo'] fields key  
        ProcessManager.updateDados(name, 'iestudo', iestudo)     

@app.route('/flask/update_checkbox', methods=['POST'])
def update_checkbox():
    payload = request.get_json() 
    # print('pkg checkboxes', payload['name'], payload['data'], file=sys.stderr);
    updatedb(payload['name'], payload['data'], 'checkboxes')    
    return Response(status=204)     

@app.route('/flask/update_eventview', methods=['POST'])
def update_collapse():
    payload = request.get_json()  
    # print('pkg eventview', payload['name'], payload['data'], file=sys.stderr);  
    updatedb(payload['name'], payload['data'], 'eventview')     
    return Response(status=204)

from bs4 import BeautifulSoup as soup 

# like /scm?process=830.691/2023
@app.route('/flask/scm', methods=['GET'], strict_slashes=False)
def scm_page():
    """return scm page stored only the piece with processo information"""
    name =  fmtPname(request.args.get('process'))
    print(f'process is {name}', file=sys.stderr)
    html_content = ProcessManager[name].basic_html
    sp = soup(html_content, "html.parser")
    res = sp.select('body form div table table:nth-child(3)')[0]    
    return str(res)


#
# routines used by the `css_js_inject` chrome extension helper injection tool
#

@app.route('/flask/get_prioridade', methods=['GET'])  # like /get_prioridade?process=830.691/2023
def get_prioridade():
    """return list (without dot on name) of interferentes with process if checked-market or not
    for use on css_js_inject tool"""
    key = request.args.get('process')    
    print(f'js_inject process is {key}', file=sys.stderr)
    dados = ProcessManager.getDados(key)
    if ('iestudo' in dados and 
        'states' in dados['iestudo'] and 
        'checkboxes' in dados['iestudo']['states']):        
        dict_ =  dados['iestudo']['states']['checkboxes'] # json iestudo table 
        # turn in acceptable javascript format for processes - otherwise wont work 
        # 1. no dots 
        # 2. no leading zeros 
        def fmtPnameJs(name):
            num, year = numberyearPname(name, int)        
            return '/'.join([str(num),str(year)])        
        return { fmtPnameJs(key) : value for key, value in dict_.items() } # remove dot for javascript use
    print(f'js_inject process is {key} did not find checkboxes states', file=sys.stderr)
    return {}

@app.route('/flask/iestudo_finish', methods=['GET'])  
def iestudo_finish():
    """
    css_js_inject helper tool
     * reports estudo finished
     * saves estudo pdf on Downloads folder as R_xxxxxx_xxx.pdf format
    """
    key = request.args.get('process')    
    dados = ProcessManager.getDados(key) # since html comes without dot
    finished = {'done': True, 'time' : datetime.datetime.now()}
    if 'iestudo' in dados:
        dados['iestudo'].update(finished)  
    else:
        dados['iestudo'] = finished
    ProcessManager.updateDados(key, 'iestudo', dados['iestudo'])  
    # wait some 15 seconds and copy the R pdf from download folder to correct folder....
    def move_pdf_n_finish():
        try:
            time.sleep(15)
            number, year = numberyearPname(key)
            # search by the latest (1)(2) etc...        
            source_pdfs = list(pathlib.Path(pathlib.Path.home() / "Downloads").glob(f"R_{number}_{year}*"))
            source_pdfs = sorted(source_pdfs, key=os.path.getctime, reverse=True) # sort by most recent 
            pdf_path = pathlib.Path(config['processos_path']) / f"{number}-{year}" / "R.pdf" 
            shutil.copy(source_pdfs[0], pdf_path) # get the most recent [0]
        except IndexError: # big pdf, slow download-processing by sigareas
            time.sleep(15) # wait a bit more
            move_pdf_n_finish()
    threading.Thread(target=move_pdf_n_finish).start()
    return Response(status=204)

cache.set('dbloaded', 0)
cache.set('timespent', 99999.99e6)
cache.set('processos_dict', {})

# Serving 'production' React App from here flask
# it's already using the /build as static folder (above!)
@app.errorhandler(404) # pages not found direct to react/index.html/javascript bundle
@app.route('/')
def index(e=None):
    return app.send_static_file("index.html")

@app.route('/<path:path>')
def static_proxy(path):
    return app.send_static_file(path)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-d','--dev', default=False, action='store_true')    
    args = parser.parse_args()
    if args.dev:
        # do something nice on development when running from nodejs frontend
        pass 
    threading.Thread(target=backgroundUpdate).start()
    app.run(host='0.0.0.0', debug=args.dev, port=5000)   
    

# To think about if saving the page table is enough
# From html would work still?

# from bs4 import BeautifulSoup as soup 
# for name, obj in scm.ProcessStorage.items():
#     sp = soup(obj._pages['basic']['html'], "html.parser")
#     res = sp.select('body form div table table:nth-child(3)')[0]
#     obj._pages['basic']['html'] = str(res) 
#     obj.changed()