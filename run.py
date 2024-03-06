import argparse
import os

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run the workapp app or only backend in development mode -d or --dev')
    parser.add_argument('-d', '--dev', action='store_true', help='Run in development mode', default=False)
    args = parser.parse_args()
    if args.dev:         # frontend being served from nodejs `npm start`
        os.environ['APP_ENV'] = 'development'
    else:
        os.environ['APP_ENV'] = 'production'
    from . import main # can only import after APP_ENV is set
    main.run()  # Call the original main function