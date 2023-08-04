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
from aidbag.anm.careas.scm import (
    ProcessManager,
    sync_with_database
    )
from aidbag.anm.careas.scm.util import (
    fmtPname,
    numberyearPname
    )
from aidbag.anm.careas.estudos.interferencia import (
        Interferencia, 
        prettyTabelaInterferenciaMaster
    )

app = Flask(__name__, static_folder='build')

# to allow the anm domain (js,html injection) request this app on localhost
CORS(app) # This will enable CORS for all routes
app.config['CACHE_DEFAULT_TIMEOUT'] = 31536000 # 1 year of cache
# Flask-Cache package
app.config['CACHE_THRESHOLD'] = 10000
app.config['CACHE_DIR'] = pathlib.Path.home() / pathlib.Path(".workapp/cache") #  temporary directory that don't gets erased timely
app.config['CACHE_TYPE'] = 'FileSystemCache' 
cache = Cache(app)

def jsTableData(table): 
    """create data to be send as JSON to frontend to create <table><tr><th><td> etc. """
    # additional columns created for stilying or UI/UX with css, jquery, jscript
    if table is None: 
        return None 
    table = table.copy()
    table['evindex'] = None 
    table['evn'] = None   
    for _, group in table.groupby(table.Processo):
        table.loc[group.index, 'evn'] = len(group) 
        table.loc[group.index, 'evindex'] = list(range(len(group)))        
    # for backward compatibility rearrange columns
    table = table[['Prior', 'Ativo', 'Processo', 'Evento', 'EvSeq', 'Descrição', 'Data', 
            'DataPrior', 'EvPrior', 'Inativ', 'Obs', 'DOU', 'Dads', 'Sons',
            'evindex', 'evn']]     
    if 'DataPrior' in table.columns: # rename columns 
        table.rename(columns={'DataPrior' : 'Protocolo'}, inplace=True)           
    if 'Protocolo' in table.columns: # remove useless column
        table.drop(columns=['Protocolo'], inplace=True)        
    if 'EvSeq' in table.columns:
        table.rename(columns={'EvSeq' : '#'}, inplace=True)    
    row_attrs = ['Ativo', 'evindex', 'evn'] # List of columns add as attributes in each row element.
    row_cols = table.columns.to_list() # List of columns to write as children in row element. By default, all columns
    row_cols = [ v for v in row_cols if v not in ['evindex', 'evn'] ] # dont use these as columns 
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
    return table_pretty[row_cols].values.tolist(), row_cols, table[row_attrs].values.tolist(), row_attrs, states 

@sync_with_database
@app.route('/flask/analyze', methods=['POST'])
def startTableAnalysis():
    name = request.get_json()['name'] 
    # getting from dictionary - but with a new session  
    processobj = ProcessManager[name] 
    dados = processobj.dados # table/states read here - returns a deep.copy   
    table_pd = None # pandas table
    dbdata = {'iestudo' : {} } # to update-add process|database table/states 'iestudo' info
    if 'iestudo' in dados and 'table' in dados['iestudo']: # from database
        dbdata['iestudo'] = copy.deepcopy(dados['iestudo']) # already present
        table_pd = pd.DataFrame.from_dict(dados['iestudo']['table'])        
    else: # from legacy excel   
        try:
            print(f"{dados['NUP']} Not using database json! Loading from legacy excel table.", file=sys.stderr)
            estudo = Interferencia.from_excel(wf.ProcessPathStorage[name])        
            table_pd = prettyTabelaInterferenciaMaster(estudo.tabela_interf_master, view=False)
        except RuntimeError:
            table_pd = None    
    # make the payload for javascript    
    jsdata = dados # unecessary variable but better for clarity
    jsdata['prioridade'] = dados['prioridade'].strftime("%d/%m/%Y %H:%M:%S") # better date/view format    
    if 'iestudo' not in jsdata:
        jsdata['iestudo'] = {}  
    if table_pd is not None:      
        # those are payload data dont mistake it with the real dados dict saved on database        
        table, headers, attrs, attrs_names, states = jsTableData(table_pd)                 
        jsdata['iestudo']['table'] = table                                    
        jsdata['iestudo']['headers'] = headers            
        jsdata['iestudo']['attrs'] = attrs
        jsdata['iestudo']['attrs_names'] = attrs_names
        # states 'checkboxes'/'eventview' will be saved/updated on DB when onClick or onChange
        if 'states' in dados['iestudo']:
            # use database states if present except for groupindexes not on database
            # dados['iestudo']['states'] will be present above read  # table/states read here
            if not 'checkboxes' in dados['iestudo']['states']:
                jsdata['iestudo']['states'].update({'checkboxes' : states['checkboxes']})
            if not 'eventview' in dados['iestudo']['states']:
                jsdata['iestudo']['states'].update({'eventview' : states['eventview']})
        else:
            jsdata['iestudo']['states'] = states              
        # ONLY: 'states' and table_pd (pandas dict) are saved on database dados['iestudo'] dict      
        # ['groupindexes'] is not saved on DB but we need it to plot
        dbdata['iestudo']['states'] = copy.deepcopy(jsdata['iestudo']['states']) # add without it        
        jsdata['iestudo']['states'].update({'groupindexes' : states['groupindexes']})        
        # deepcopy is avoiding dbdata linked to jsdata dict, so 'table' key gets overwritten bellow
        # database saves table as dataframe ->dict != from prettyfied pandas jsdata json-list   
        dbdata['iestudo']['table'] = table_pd.to_dict()
    else: # table_pd is None
        # add status of finished/not-finished priority check on table
        dbdata['iestudo'].update({'done' : False, 'time' : datetime.datetime.now() })         
        jsdata['iestudo'].update(copy.deepcopy(dbdata['iestudo']))
    processobj.db.dados.update(dbdata)  # add or update ['iestudo'] fields key              
    return jsdata 

@sync_with_database
def getCurrentProcessFolders():        
    processos = {} 
    for process in wf.currentProcessGet():    
        # objects are created - in this session - thread
        # each request in a new thread (or two sometimes) 
        # more details on ProcessManager about  - Flask WSGI request_context thread behaviour
        processos.update({process : ProcessManager[process].dados})  
    cache.set('processos_dict', processos)


@app.route('/flask/list', methods=['GET'])
def getProcessos():                  
    getCurrentProcessFolders()  # update processes folder from working folder
    return { 
            'processos' : cache.get('processos_dict'),
            'status'    : { 
                'workfolder' : config['processos_path'],             
                'dbloaded' : cache.get('dbloaded'), 
                'timespent' : cache.get('timespent') 
                }
            }

@sync_with_database
def updatedb(name, data, what='eventview', save=False):    
    """update cached estudo table and estudo file on database DADOS column"""    
    process = ProcessManager[name]            
    iestudo = {}
    dados = process.dados ## already a copy
    if 'iestudo' in dados:
        iestudo = dados['iestudo'] 
        if 'states' not in iestudo:
            iestudo['states'] = {}
        if 'checkboxes' in what:            
            iestudo['states'].update({'checkboxes' : data })
        elif 'eventview' in what:
            iestudo['states'].update({'eventview' : data })    
        # should use the process storage lock here...        
        process.db.dados.update({'iestudo' : iestudo})  # add or update ['iestudo'] fields key       

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
@sync_with_database
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
@sync_with_database
@app.route('/flask/get_prioridade', methods=['GET'])  # like /get_prioridade?process=830.691/2023
def get_prioridade():
    """return list (without dot on name) of interferentes with process if checked-market or not
    for use on css_js_inject tool"""
    key = request.args.get('process')    
    print(f'js_inject process is {key}', file=sys.stderr)
    processo = ProcessManager[key] 
    dados = processo.dados 
    if ('iestudo' in dados and 
        'states' in dados['iestudo'] and 
        'checkboxes' in dados['iestudo']['states']):        
        dict_ =  dados['iestudo']['states']['checkboxes'] # json iestudo table 
        return { key.replace(".", "") : value for key, value in dict_.items() } # remove dot for javascript use
    print(f'js_inject process is {key} did not find checkboxes states', file=sys.stderr)
    return {}

@sync_with_database
@app.route('/flask/iestudo_finish', methods=['GET'])  
def iestudo_finish():
    """
    css_js_inject helper tool
     * reports estudo finished
     * saves estudo pdf on Downloads folder as R_xxxxxx_xxx.pdf format
    """
    key = request.args.get('process')    
    processo = ProcessManager[key] # since html comes without dot
    finished = {'done': True, 'time' : datetime.datetime.now()}  
    if 'iestudo' in processo:
        processo.db.dados['iestudo'].update(finished)
    else:
        processo.db.dados['iestudo'] = finished    
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
@app.route('/')
def index():
    return send_from_directory('build', 'index.html')
@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('build', path)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-d','--dev', default=False, action='store_true')    
    args = parser.parse_args()
    if args.dev:
        # do something nice on development when running from nodejs frontend
        pass 
    app.run(host='0.0.0.0', debug=args.dev, port=5000)   
    

# To think about if saving the page table is enough
# From html would work still?

# from bs4 import BeautifulSoup as soup 
# for name, obj in scm.ProcessStorage.items():
#     sp = soup(obj._pages['basic']['html'], "html.parser")
#     res = sp.select('body form div table table:nth-child(3)')[0]
#     obj._pages['basic']['html'] = str(res) 
#     obj.changed()