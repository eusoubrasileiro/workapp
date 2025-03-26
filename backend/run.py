import argparse
import os
import time 
import subprocess
import threading

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run the workapp app or only backend in development mode -d or --dev')
    parser.add_argument('-d', '--dev', action='store_true', help='Run in development mode', default=False)
    args = parser.parse_args()
    if args.dev: # frontend being served from nodejs `npm start`
        os.environ['APP_ENV'] = 'development'
        port = 3000
    else:
        os.environ['APP_ENV'] = 'production'
        port = 5000
    from .main import app # can only import after APP_ENV is set
    # Execute the command in the shell
    def open_browser():
        time.sleep(1.5)
        subprocess.run(f"google-chrome http://localhost:{port}", shell=True)
    threading.Thread(target=open_browser).start()    
    app.run(host='0.0.0.0', debug=(os.environ.get('APP_ENV') == 'development'), port=5000) # Call the original main function    
    