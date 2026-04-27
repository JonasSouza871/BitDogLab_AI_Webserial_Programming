---
title: BitDogLab AI WebSerial
colorFrom: blue
colorTo: cyan
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Browser-based assistant for generating and sending MicroPython code to BitDogLab V7 via Web Serial.
---

<div align="center">
  <img src="images/icon-bitdoglab-nobg.png" alt="BitDogLab logo" width="88" />
  <h1>BitDogLab AI WebSerial</h1>
  <p>AI-assisted browser interface for generating, reviewing, and sending MicroPython code to BitDogLab V7 boards through Web Serial.</p>
  <p>
    <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11" />
    <img src="https://img.shields.io/badge/Flask-Backend-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask Backend" />
    <img src="https://img.shields.io/badge/HTML5-Interface-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5 Interface" />
    <img src="https://img.shields.io/badge/CSS3-Styling-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3 Styling" />
    <img src="https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111111" alt="JavaScript Frontend" />
    <img src="https://img.shields.io/badge/Web%20Serial-Device%20Link-0F766E?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Web Serial Device Link" />
    <img src="https://img.shields.io/badge/xterm.js-Terminal-166534?style=for-the-badge&logo=gnu-bash&logoColor=white" alt="xterm.js Terminal" />
    <img src="https://img.shields.io/badge/Docker-Deploy-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Deploy" />
    <img src="https://img.shields.io/badge/MicroPython-Target-2B2728?style=for-the-badge&logo=micropython&logoColor=white" alt="MicroPython Target" />
    <img src="https://img.shields.io/badge/Groq-AI%20Proxy-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq AI Proxy" />
  </p>
  <p><strong><a href="#portugues">Português</a> | <a href="#english">English</a></strong></p>
</div>

---

<a id="portugues"></a>

# Português

## Visão geral
BitDogLab AI WebSerial é uma interface focada no navegador para salas de aula, laboratórios e oficinas. O projeto permite que estudantes e instrutores descrevam o que desejam criar, recebam código MicroPython adaptado à BitDogLab V7 e enviem esse código diretamente para a placa sem depender do fluxo tradicional com IDE de desktop.

## O que este repositório entrega
- Interface de chat responsiva construída com HTML, CSS e JavaScript puro.
- Terminal serial embutido com xterm.js.
- Comunicação direta com a placa por meio da Web Serial API.
- Arquivos de contexto específicos para BitDogLab V7, prompts de matriz LED e prompts de músicas.
- Integração flexível com IA por meio de `js/config.js` local ou de um proxy backend em Flask.
- Estrutura pronta para execução local ou publicação com Docker.

## Arquitetura
```text
Usuário
  -> Interface no navegador
  -> Camada de geração com IA
  -> Saída em MicroPython
  -> Web Serial API
  -> Placa BitDogLab V7

Canal paralelo:
Terminal embutido (xterm.js) <-> Web Serial API <-> REPL da placa
```

## Stack técnica
- Frontend: HTML5, CSS3 e JavaScript puro.
- Backend: Python 3.11, Flask e Requests.
- Comunicação com dispositivo: Web Serial API.
- Terminal: xterm.js.
- Camada de IA: APIs compatíveis com o formato OpenAI, com fluxo opcional de proxy via Flask e Groq.
- Deploy: Docker.
- Runtime alvo: MicroPython na BitDogLab V7 / Raspberry Pi Pico W.

## Estrutura do repositório
```text
.
|-- app.py
|-- Dockerfile
|-- index.html
|-- css/
|   |-- animations.css
|   `-- style.css
|-- js/
|   |-- ai.js
|   |-- app.js
|   |-- config.example.js
|   `-- webserial.js
|-- context/
|   |-- bitdoglab.md
|   |-- matriz.md
|   `-- musicas.md
|-- lib/
|   `-- xterm/
`-- images/
```

## Execução local
1. Instale as dependências Python.
```powershell
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
pip install flask requests
```
2. Escolha um modo de configuração da IA.

`Proxy backend`
```powershell
$env:GROQ_API_KEY="sua_api_key"
$env:AI_MODEL="meta-llama/llama-4-scout-17b-16e-instruct"
python app.py
```

`Configuração direta no navegador`
```powershell
Copy-Item js\config.example.js js\config.js
python app.py
```

Edite `js/config.js` com `provider`, `baseUrl`, `model` e `apiKey` antes de abrir a aplicação.

3. Acesse `http://localhost:7860` no Chrome ou Edge e conecte a placa.

## Nota de segurança
- `js/config.js` é ignorado pelo Git e foi pensado para uso local ou pessoal.
- Uma chave exposta no navegador fica visível ao cliente, então o proxy em Flask é a alternativa mais adequada para deploys compartilhados ou públicos.

## Docker
```powershell
docker build -t bitdoglab-ai-webserial .
docker run --rm -p 7860:7860 -e GROQ_API_KEY=sua_api_key bitdoglab-ai-webserial
```

## Compatibilidade de navegador
- Suportado: Chrome, Edge e Opera com suporte à Web Serial API.
- Não suportado: Firefox e Safari.
- A Web Serial API exige contexto seguro, como `http://localhost` ou HTTPS.

## Licença
MIT

---

<a id="english"></a>

# English

## Overview
BitDogLab AI WebSerial is a browser-first interface for classrooms, labs, and workshops. It lets students and instructors describe what they want to build, receive MicroPython code tailored to BitDogLab V7, and send that code directly to the board without relying on a traditional desktop IDE workflow.

## What this repository includes
- Responsive chat interface built with HTML, CSS, and vanilla JavaScript.
- Embedded serial terminal powered by xterm.js.
- Direct board communication through the Web Serial API.
- Hardware-aware context files for BitDogLab V7, LED matrix prompts, and music generation prompts.
- Flexible AI integration through either a local `js/config.js` file or a Flask backend proxy.
- Docker-ready deployment for local hosting or cloud environments.

## Architecture
```text
User
  -> Browser UI
  -> AI generation layer
  -> MicroPython output
  -> Web Serial API
  -> BitDogLab V7 board

Parallel channel:
Embedded terminal (xterm.js) <-> Web Serial API <-> Board REPL
```

## Technical stack
- Frontend: HTML5, CSS3, vanilla JavaScript.
- Backend: Python 3.11, Flask, Requests.
- Device communication: Web Serial API.
- Terminal: xterm.js.
- AI layer: OpenAI-compatible chat APIs, with optional Groq proxy flow through Flask.
- Deployment: Docker.
- Target runtime: MicroPython on BitDogLab V7 / Raspberry Pi Pico W.

## Repository structure
```text
.
|-- app.py
|-- Dockerfile
|-- index.html
|-- css/
|   |-- animations.css
|   `-- style.css
|-- js/
|   |-- ai.js
|   |-- app.js
|   |-- config.example.js
|   `-- webserial.js
|-- context/
|   |-- bitdoglab.md
|   |-- matriz.md
|   `-- musicas.md
|-- lib/
|   `-- xterm/
`-- images/
```

## Running locally
1. Install the Python dependencies.
```powershell
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
pip install flask requests
```
2. Choose one AI configuration mode.

`Backend proxy`
```powershell
$env:GROQ_API_KEY="your_api_key"
$env:AI_MODEL="meta-llama/llama-4-scout-17b-16e-instruct"
python app.py
```

`Direct browser configuration`
```powershell
Copy-Item js\config.example.js js\config.js
python app.py
```

Edit `js/config.js` with your `provider`, `baseUrl`, `model`, and `apiKey` before opening the app.

3. Open `http://localhost:7860` in Chrome or Edge and connect the board.

## Security note
- `js/config.js` is ignored by Git and is suitable for local or personal use.
- A browser-side API key is exposed to the client, so the Flask proxy is the better option for shared or public deployments.

## Docker
```powershell
docker build -t bitdoglab-ai-webserial .
docker run --rm -p 7860:7860 -e GROQ_API_KEY=your_api_key bitdoglab-ai-webserial
```

## Browser compatibility
- Supported: Chrome, Edge, and Opera versions with Web Serial support.
- Not supported: Firefox and Safari.
- Web Serial requires a secure context such as `http://localhost` or HTTPS.

## License
MIT
