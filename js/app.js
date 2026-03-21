/**
 * App - BitDogLab AI WebSerial
 * Frontend simples e amigável
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
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const messagesContainer = document.getElementById('messages');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const chatSection = document.getElementById('chatSection');
    const terminalSection = document.getElementById('terminalSection');

    // Instância do WebSerial
    const serial = new WebSerial();

    // Terminal xterm.js
    const term = new Terminal({
        cursorBlink: true,
        theme: {
            background: '#0f0c1a',
            foreground: '#f0f0f0',
            cursor: '#b829dd',
            selection: 'rgba(184, 41, 221, 0.3)'
        },
        fontSize: 14,
        fontFamily: 'SF Mono, Monaco, monospace',
        scrollback: 10000
    });

    term.open(document.getElementById('terminal'));
    
    // Mensagem inicial simples
    term.writeln('\r\nBitDogLab - Terminal');
    term.writeln('--------------------');
    term.writeln('Clique em "Conectar" para começar.\r\n');

    // Callbacks do WebSerial
    serial.onData((data) => term.write(data));

    serial.onConnect(() => {
        updateUIState(true);
        term.writeln('\r\n[Conectado]');
        addSystemMessage('Sua placa está conectada!');
    });

    serial.onDisconnect(() => {
        updateUIState(false);
        term.writeln('\r\n[Desconectado]');
        addSystemMessage('Placa desconectada.');
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
            statusDot.classList.remove('disconnected');
            statusDot.classList.add('connected');
            statusText.textContent = 'Conectado';
        } else {
            statusDot.classList.remove('connected');
            statusDot.classList.add('disconnected');
            statusText.textContent = 'Desconectado';
        }
    }

    // Eventos do terminal
    connectBtn.addEventListener('click', async () => {
        if (!WebSerial.isSupported()) {
            addSystemMessage('Use Chrome, Edge ou Opera para conectar.');
            return;
        }
        try {
            await serial.connect(parseInt(baudRateSelect.value));
        } catch (error) {
            if (error.name !== 'NotFoundError') {
                term.writeln(`\r\nErro: ${error.message}`);
            }
        }
    });

    disconnectBtn.addEventListener('click', () => serial.disconnect());
    clearBtn.addEventListener('click', () => term.clear());
    sendBtn.addEventListener('click', sendCommand);
    commandInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendCommand());

    async function sendCommand() {
        const command = commandInput.value.trim();
        if (!command) return;
        try {
            await serial.sendCommand(command);
            commandInput.value = '';
        } catch (error) {
            term.writeln(`\r\nErro: ${error.message}`);
        }
    }

    ctrlCBtn.addEventListener('click', async () => {
        await serial.sendCtrlC();
        term.writeln('^C');
    });

    ctrlDBtn.addEventListener('click', async () => {
        await serial.sendCtrlD();
        term.writeln('^D');
    });

    // Funções do Chat
    function addMessage(text, type = 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        const lines = text.split('\n');
        lines.forEach(line => {
            const p = document.createElement('p');
            p.textContent = line;
            bubbleDiv.appendChild(p);
        });
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.appendChild(bubbleDiv);
        messageDiv.appendChild(timeSpan);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function addUserMessage(text) { addMessage(text, 'user'); }
    function addSystemMessage(text) { addMessage(text, 'system'); }

    function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        addUserMessage(text);
        chatInput.value = '';
        
        // Resposta temporária da IA (integração futura)
        setTimeout(() => {
            addSystemMessage('Assistente em breve! Por enquanto use o terminal para programar.');
        }, 500);
    }

    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendChatMessage());

    // Mobile tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (tab === 'chat') {
                chatSection.classList.add('active');
                terminalSection.classList.remove('active');
            } else {
                chatSection.classList.remove('active');
                terminalSection.classList.add('active');
                setTimeout(() => term.fit?.(), 100);
            }
        });
    });

    // Resize
    window.addEventListener('resize', () => setTimeout(() => term.fit?.(), 100));

    // Verificação inicial
    if (!WebSerial.isSupported()) {
        connectBtn.disabled = true;
        addSystemMessage('Use Chrome, Edge ou Opera para conectar sua placa.');
    }
});
