# WorkApp

**WorkApp** is a Flask-React application designed to analyze the "interferência" table using data collected (web scraping) from the Brazilian National Agency of Mining (ANM). This application relies on data initially gathered by the [aidbag](https://github.com/eusoubrasileiro/aidbag/tree/master/anm) web scraping system. The web scraping process is completed first, creating a folder for each 'Processo' and populating a local SQLite database with the scraped data.

## Features

The application offers two main interfaces:

1. **Web Application**: Runs locally and displays all web-scraped process information. Upon interactive work it saves the results of the "interferência" table analysis into a SQLite database.

#### Process Selection and Status Overview

![Process Selection and Status Overview](https://github.com/user-attachments/assets/2d0fcf55-1e1c-4cc1-bf8e-e6ef30cc6dae)

#### Interferência Table Analysis

![Interferência Table Analysis](https://github.com/user-attachments/assets/69059cb5-0026-41cc-8b13-82e93d915e2b)

2. **Chrome Extension**: Injects JavaScript into the ANM's "interferência" analysis system. This script reads data from the system and posts back to the backend, saving PDFs and updating process statuses and information in the database.

   A simple image example of the chrom extension interface running:
   
<p align="center">
  <img src="https://github.com/user-attachments/assets/b308fccb-0742-4f98-99ca-af23ecc85a71" />
</p>

The app saves 'prioridade' results directly from the browser to the SQLite database and utilizes `css_js_inject` scripts to save information from SIGAREAS estudo in real-time.

## Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/eusoubrasileiro/workapp.git
   cd workapp
   ```

2. **Install Backend Dependencies**:

   Ensure you have Python installed. It's recommended to use a virtual environment.

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Install Frontend Dependencies**:

   Ensure you have Node.js and npm installed.

   ```bash
   npm install
   ```

## Usage

### Running the Application

To start the backend server, run:

```bash
python -m workapp.run
```

To run the server in the background:

```bash
nohup python -m workapp.run &
```

### Frontend

To build the React frontend, execute:

```bash
npm run build
```

This will create a `build` folder used by `main.py`.

### Development

For development purposes, run the backend in development mode:

```bash
python -m workapp.run -d
```

Then, start the frontend:

```bash
npm start
```
