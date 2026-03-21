/**
 * App - Interface do WebSerial Terminal
 */
document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const clearBtn = document.getElementById('clearBtn');
    const sendBtn = document.getElementById('sendBtn');
    const ctrlCBtn = document.getElementById('ctrlCBtn');
    const ctrlDBtn = document.getElementById('ctrlDBtn');
    const commandInput = document.getElementById('commandInput');
    const baudRateSelect = document.getElementById('baudRate');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    // Instância do WebSerial
    const serial = new WebSerial();

    // Inicializa o terminal xterm.js
    const term = new Terminal({
        cursorBlink: true,
        theme: {
            background: '#1e1e1e',
            foreground: '#f0f0f0',
            cursor: '#f0f0f0',
            selection: '#444444'
        },
        fontSize: 14,
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        scrollback: 10000
    });

    term.open(document.getElementById('terminal'));
    term.writeln('\x1b[32m╔══════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[32m║     WebSerial Terminal v1.0          ║\x1b[0m');
    term.writeln('\x1b[32m╚══════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('Clique em "Conectar" para selecionar uma porta serial.');
    term.writeln('');

    // Callback quando recebe dados
    serial.onData((data) => {
        term.write(data);
    });

    // Callback quando conecta
    serial.onConnect(() => {
        updateUIState(true);
        term.writeln('\x1b[32m\r\n[Conectado]\x1b[0m');
    });

    // Callback quando desconecta
    serial.onDisconnect(() => {
        updateUIState(false);
        term.writeln('\x1b[31m\r\n[Desconectado]\x1b[0m');
    });

    // Atualiza estado da UI
    function updateUIState(connected) {
        connectBtn.disabled = connected;
        disconnectBtn.disabled = !connected;
        sendBtn.disabled = !connected;
        ctrlCBtn.disabled = !connected;
        ctrlDBtn.disabled = !connected;
        commandInput.disabled = !connected;
        baudRateSelect.disabled = connected;

        if (connected) {
            statusIndicator.classList.remove('disconnected');
            statusIndicator.classList.add('connected');
            statusText.textContent = `Conectado (${baudRateSelect.value} baud)`;
            commandInput.focus();
        } else {
            statusIndicator.classList.remove('connected');
            statusIndicator.classList.add('disconnected');
            statusText.textContent = 'Desconectado';
        }
    }

    // Botão Conectar
    connectBtn.addEventListener('click', async () => {
        if (!WebSerial.isSupported()) {
            alert('Web Serial API não é suportada neste navegador.\nUse Chrome, Edge ou Opera.');
            return;
        }

        const baudRate = parseInt(baudRateSelect.value);
        
        try {
            await serial.connect(baudRate);
        } catch (error) {
            if (error.name !== 'NotFoundError') {
                term.writeln(`\x1b[31m\r\nErro: ${error.message}\x1b[0m`);
            }
        }
    });

    // Botão Desconectar
    disconnectBtn.addEventListener('click', async () => {
        await serial.disconnect();
    });

    // Botão Limpar
    clearBtn.addEventListener('click', () => {
        term.clear();
    });

    // Botão Enviar
    sendBtn.addEventListener('click', sendCommand);

    // Enter no input
    commandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendCommand();
        }
    });

    // Envia comando
    async function sendCommand() {
        const command = commandInput.value.trim();
        if (!command) return;

        try {
            await serial.sendCommand(command);
            commandInput.value = '';
        } catch (error) {
            term.writeln(`\x1b[31mErro ao enviar: ${error.message}\x1b[0m`);
        }
    }

    // Botão Ctrl+C
    ctrlCBtn.addEventListener('click', async () => {
        try {
            await serial.sendCtrlC();
            term.writeln('\x1b[33m^C\x1b[0m');
        } catch (error) {
            term.writeln(`\x1b[31mErro: ${error.message}\x1b[0m`);
        }
    });

    // Botão Ctrl+D
    ctrlDBtn.addEventListener('click', async () => {
        try {
            await serial.sendCtrlD();
            term.writeln('\x1b[33m^D\x1b[0m');
        } catch (error) {
            term.writeln(`\x1b[31mErro: ${error.message}\x1b[0m`);
        }
    });

    // Resize do terminal
    window.addEventListener('resize', () => {
        setTimeout(() => {
            term.fit && term.fit();
        }, 100);
    });

    // Verifica suporte inicial
    if (!WebSerial.isSupported()) {
        term.writeln('\x1b[31m\r\nAVISO: Web Serial API não suportada!\x1b[0m');
        term.writeln('Use Chrome, Edge ou Opera para acessar esta funcionalidade.');
        connectBtn.disabled = true;
    }
});
