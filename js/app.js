/**
 * App - BitDogLab AI WebSerial
 * Frontend controller for chat and terminal
 */
document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // Elementos da UI - Header & Terminal
    // ==========================================
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const clearBtn = document.getElementById('clearBtn');
    const sendBtn = document.getElementById('sendBtn');
    const ctrlCBtn = document.getElementById('ctrlCBtn');
    const ctrlDBtn = document.getElementById('ctrlDBtn');
    const commandInput = document.getElementById('commandInput');
    const baudRateSelect = document.getElementById('baudRate');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    // ==========================================
    // Elementos da UI - Chat
    // ==========================================
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const messagesContainer = document.getElementById('messages');

    // ==========================================
    // Elementos da UI - Mobile Tabs
    // ==========================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const chatSection = document.getElementById('chatSection');
    const terminalSection = document.getElementById('terminalSection');

    // ==========================================
    // Instancia do WebSerial
    // ==========================================
    const serial = new WebSerial();

    // ==========================================
    // Inicializa o terminal xterm.js
    // ==========================================
    const term = new Terminal({
        cursorBlink: true,
        theme: {
            background: '#0d1117',
            foreground: '#c9d1d9',
            cursor: '#58a6ff',
            selection: '#264f78'
        },
        fontSize: 14,
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        scrollback: 10000,
        allowProposedApi: true
    });

    term.open(document.getElementById('terminal'));
    
    // Mensagem inicial no terminal
    term.writeln('\r\n\x1b[36m╔══════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[36m║    BitDogLab AI WebSerial Terminal   ║\x1b[0m');
    term.writeln('\x1b[36m╚══════════════════════════════════════╝\x1b[0m');
    term.writeln('\r\n\x1b[90mClique em "Conectar" para selecionar uma porta serial.\x1b[0m\r\n');

    // ==========================================
    // Callbacks do WebSerial
    // ==========================================
    serial.onData((data) => {
        term.write(data);
    });

    serial.onConnect(() => {
        updateUIState(true);
        term.writeln('\x1b[32m\r\n[Conectado]\x1b[0m');
        addSystemMessage('Placa conectada! Pronto para programar.');
    });

    serial.onDisconnect(() => {
        updateUIState(false);
        term.writeln('\x1b[31m\r\n[Desconectado]\x1b[0m');
        addSystemMessage('Placa desconectada.');
    });

    // ==========================================
    // Funcoes da UI - Terminal
    // ==========================================
    function updateUIState(connected) {
        connectBtn.disabled = connected;
        disconnectBtn.disabled = !connected;
        sendBtn.disabled = !connected;
        ctrlCBtn.disabled = !connected;
        ctrlDBtn.disabled = !connected;
        commandInput.disabled = !connected;
        baudRateSelect.disabled = connected;

        if (connected) {
            statusDot.classList.remove('disconnected');
            statusDot.classList.add('connected');
            statusText.textContent = `${baudRateSelect.value} baud`;
        } else {
            statusDot.classList.remove('connected');
            statusDot.classList.add('disconnected');
            statusText.textContent = 'Desconectado';
        }
    }

    // ==========================================
    // Event Listeners - Terminal Controls
    // ==========================================
    connectBtn.addEventListener('click', async () => {
        if (!WebSerial.isSupported()) {
            addSystemMessage('Web Serial API nao suportada. Use Chrome, Edge ou Opera.');
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

    disconnectBtn.addEventListener('click', async () => {
        await serial.disconnect();
    });

    clearBtn.addEventListener('click', () => {
        term.clear();
    });

    sendBtn.addEventListener('click', sendCommand);

    commandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendCommand();
        }
    });

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

    ctrlCBtn.addEventListener('click', async () => {
        try {
            await serial.sendCtrlC();
            term.writeln('\x1b[33m^C\x1b[0m');
        } catch (error) {
            term.writeln(`\x1b[31mErro: ${error.message}\x1b[0m`);
        }
    });

    ctrlDBtn.addEventListener('click', async () => {
        try {
            await serial.sendCtrlD();
            term.writeln('\x1b[33m^D\x1b[0m');
        } catch (error) {
            term.writeln(`\x1b[31mErro: ${error.message}\x1b[0m`);
        }
    });

    // ==========================================
    // Funcoes do Chat
    // ==========================================
    function addMessage(text, type = 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        // Suporte a multiplas linhas
        const lines = text.split('\n');
        lines.forEach(line => {
            const p = document.createElement('p');
            p.textContent = line;
            bubbleDiv.appendChild(p);
        });
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = getCurrentTime();
        
        messageDiv.appendChild(bubbleDiv);
        messageDiv.appendChild(timeSpan);
        
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function addUserMessage(text) {
        addMessage(text, 'user');
    }

    function addAIMessage(text) {
        addMessage(text, 'ai');
    }

    function addSystemMessage(text) {
        addMessage(text, 'system');
    }

    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Adiciona mensagem do usuario
        addUserMessage(text);
        
        // Limpa input
        chatInput.value = '';
        
        // Aqui sera integrado com a API de IA
        // Por enquanto, simula uma resposta
        simulateAIResponse(text);
    }

    function simulateAIResponse(userText) {
        // Simula delay de "pensamento"
        setTimeout(() => {
            addSystemMessage('IA ainda nao configurada. Aguardando integracao com API...');
        }, 1000);
    }

    // ==========================================
    // Event Listeners - Chat
    // ==========================================
    chatSendBtn.addEventListener('click', sendChatMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // ==========================================
    // Mobile Tabs
    // ==========================================
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Atualiza botoes
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Atualiza secoes
            if (tab === 'chat') {
                chatSection.classList.add('active');
                terminalSection.classList.remove('active');
            } else {
                chatSection.classList.remove('active');
                terminalSection.classList.add('active');
                // Refit terminal quando mostrado
                setTimeout(() => {
                    term.fit && term.fit();
                }, 100);
            }
        });
    });

    // ==========================================
    // Resize do terminal
    // ==========================================
    window.addEventListener('resize', () => {
        setTimeout(() => {
            term.fit && term.fit();
        }, 100);
    });

    // ==========================================
    // Inicializacao
    // ==========================================
    if (!WebSerial.isSupported()) {
        term.writeln('\x1b[31m\r\nAVISO: Web Serial API nao suportada!\x1b[0m');
        term.writeln('\x1b[90mUse Chrome, Edge ou Opera.\x1b[0m');
        connectBtn.disabled = true;
        addSystemMessage('Seu navegador nao suporta Web Serial. Use Chrome, Edge ou Opera.');
    }

    // Expose functions for external use (Claude/AI integration)
    window.ChatUI = {
        addUserMessage,
        addAIMessage,
        addSystemMessage,
        sendToTerminal: (code) => {
            term.writeln(`\r\n\x1b[36m[Codigo recebido da IA]\x1b[0m`);
        }
    };
});
