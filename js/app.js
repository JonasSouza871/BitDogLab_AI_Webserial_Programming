/**
 * App - BitDogLab AI WebSerial
 * Frontend com syntax highlight e envio de código
 */
document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resetBtn = document.getElementById('resetBtn');
    const stopBtn = document.getElementById('stopBtn');
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
    const presentationMediaQuery = window.matchMedia('(min-width: 769px)');
    const urlParams = new URLSearchParams(window.location.search);
    let presentationModeEnabled = !['0', 'false', 'no'].includes((urlParams.get('presentation') || '').toLowerCase());

    // Instância do WebSerial
    const serial = new WebSerial();

    // Terminal xterm.js - Tema customizado
    const term = new Terminal({
        cursorBlink: true,
        theme: {
            background: '#161221',
            foreground: '#89b4fa',
            background: '#161221',
            cursor: '#b829dd',
            selection: 'rgba(137, 180, 250, 0.3)',
            black: '#161221',
            red: '#ff3860',
            green: '#39ff14',
            yellow: '#ffd700',
            blue: '#89b4fa',
            magenta: '#b829dd',
            cyan: '#74c7ec',
            white: '#cdd6f4',
            brightBlack: '#2d2440',
            brightRed: '#ff6b8a',
            brightGreen: '#5aff3a',
            brightYellow: '#ffe44d',
            brightBlue: '#a6c9ff',
            brightMagenta: '#d14dff',
            brightCyan: '#89dceb',
            brightWhite: '#ffffff'
        },
        fontSize: 13,
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        scrollback: 10000,
        lineHeight: 1.3,
        letterSpacing: 0.5
    });

    term.open(document.getElementById('terminal'));
    
    // Mensagem inicial
    term.writeln('\r\nBitDogLab - Terminal');
    term.writeln('--------------------');
    term.writeln('Clique em "Conectar" para começar.\r\n');

    // Callbacks do WebSerial
    let serialBuffer = '';
    let micropythonReady = false;

    serial.onData((data) => {
        term.write(data);

        // Detecta prompt do MicroPython (>>> )
        serialBuffer += data;
        serialBuffer = serialBuffer.slice(-50); // guarda so os ultimos 50 chars

        if (serialBuffer.includes('>>>') && !micropythonReady) {
            micropythonReady = true;
            addSystemMessage('MicroPython pronto! Pode enviar codigos.');
        }

        // Detecta mensagem de boot do MicroPython
        if (data.includes('MicroPython') && data.includes('Pico')) {
            micropythonReady = false; // vai ficar true quando >>> aparecer
        }
    });

    serial.onConnect(() => {
        updateUIState(true);
        micropythonReady = false;
        term.writeln('\r\n\x1b[32m[Conectado]\x1b[0m');
        addSystemMessage('Placa conectada! Aguardando MicroPython...');
        // Envia Ctrl+C para ir ao prompt
        setTimeout(() => serial.sendCtrlC(), 300);
    });

    serial.onDisconnect(() => {
        updateUIState(false);
        term.writeln('\r\n\x1b[31m[Desconectado]\x1b[0m');
        addSystemMessageHTML('Placa <span style="color: #ff3860; font-weight: 600;">desconectada</span>.');
    });

    // Atualiza estado da UI
    function updateUIState(connected) {
        connectBtn.disabled = connected;
        disconnectBtn.disabled = !connected;
        resetBtn.disabled = !connected;
        stopBtn.disabled = !connected;
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

    resetBtn.addEventListener('click', async () => {
        if (!serial.connected) return;
        micropythonReady = false;
        await serial.sendCtrlD();
        term.writeln('\x1b[33m[Reset - Ctrl+D]\x1b[0m');
        addSystemMessage('Resetando placa...');
    });

    stopBtn.addEventListener('click', async () => {
        if (!serial.connected) return;
        await serial.sendCtrlC();
        term.writeln('\x1b[33m[Parar - Ctrl+C]\x1b[0m');
        addSystemMessage('Execucao interrompida.');
    });

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

    // ==========================================
    // Funções do Chat
    // ==========================================
    
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
        
        return { messageDiv, bubbleDiv };
    }

    function addUserMessage(text) { addMessage(text, 'user'); }
    function addSystemMessage(text) { addMessage(text, 'system'); }

    function fitCodeBlocksForPresentation() {
        if (!document.body.classList.contains('presentation-mode')) return;

        const codeBlocks = document.querySelectorAll('.code-block');
        codeBlocks.forEach((block) => {
            const pre = block.querySelector('pre');
            const codeEl = block.querySelector('code');
            if (!pre || !codeEl) return;

            const lines = codeEl.textContent.split('\n');
            const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 1);
            const availableWidth = Math.max(pre.clientWidth - 12, 100);
            const availableHeight = Math.max(pre.clientHeight - 12, 100);

            const widthBasedSize = availableWidth / (longestLine * 0.62);
            const heightBasedSize = availableHeight / (Math.max(lines.length, 1) * 1.12);
            const fontSize = Math.max(14, Math.min(22, Math.floor(Math.min(widthBasedSize, heightBasedSize))));

            codeEl.style.fontSize = `${fontSize}px`;
            codeEl.style.lineHeight = '1.12';
        });
    }

    function updatePresentationMode() {
        const isPresentationMode = presentationModeEnabled && presentationMediaQuery.matches;
        document.body.classList.toggle('presentation-mode', isPresentationMode);

        if (!isPresentationMode) {
            document.querySelectorAll('.code-block code').forEach((codeEl) => {
                codeEl.style.fontSize = '';
                codeEl.style.lineHeight = '';
            });
        }

        requestAnimationFrame(fitCodeBlocksForPresentation);
    }
    
    function addSystemMessageHTML(html) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        const p = document.createElement('p');
        p.innerHTML = html;
        bubbleDiv.appendChild(p);
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.appendChild(bubbleDiv);
        messageDiv.appendChild(timeSpan);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Adiciona mensagem da IA - so mostra codigo + botao enviar
    function addAIMessage(text) {
        const codes = AI.extractCode(text);

        if (codes.length > 0) {
            // Mostra cada bloco de codigo separado
            codes.forEach(code => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message ai';

                const wrapper = document.createElement('div');
                wrapper.className = 'code-block';

                const pre = document.createElement('pre');
                const codeEl = document.createElement('code');
                codeEl.textContent = code;
                pre.appendChild(codeEl);
                wrapper.appendChild(pre);

                const btn = document.createElement('button');
                btn.className = 'btn-send-code';
                btn.textContent = 'Enviar para placa';
                btn.addEventListener('click', () => sendCodeToBoard(code, btn));
                wrapper.appendChild(btn);

                messageDiv.appendChild(wrapper);

                const timeSpan = document.createElement('span');
                timeSpan.className = 'message-time';
                timeSpan.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                messageDiv.appendChild(timeSpan);

                messagesContainer.appendChild(messageDiv);
            });
            requestAnimationFrame(fitCodeBlocksForPresentation);
        } else {
            // Sem codigo - mostra texto normal
            addMessage(text, 'ai');
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Envia código para a placa
    async function sendCodeToBoard(code, button) {
        if (!serial.connected) {
            addSystemMessage('Conecte sua placa primeiro!');
            return;
        }

        button.textContent = 'Enviando...';
        button.disabled = true;

        try {
            // Ctrl+C para interromper
            await serial.sendCtrlC();
            await sleep(100);

            // Modo paste (Ctrl+E)
            await serial.write('\x05');
            await sleep(100);

            // Envia código linha por linha
            const lines = code.split('\n');
            for (const line of lines) {
                await serial.write(line + '\r\n');
                await sleep(20);
            }

            // Executa (Ctrl+D)
            await serial.write('\x04');

            button.textContent = 'Enviado!';
        } catch (error) {
            button.textContent = 'Erro';
            addSystemMessage('Erro ao enviar: ' + error.message);
        }

        setTimeout(() => {
            button.textContent = 'Enviar para placa';
            button.disabled = false;
        }, 2000);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Indicador de "pensando..."
    function showThinkingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai thinking';
        messageDiv.id = 'thinkingIndicator';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        const dots = document.createElement('div');
        dots.className = 'thinking-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';
        
        bubbleDiv.appendChild(dots);
        messageDiv.appendChild(bubbleDiv);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageDiv;
    }

    function hideThinkingIndicator() {
        const indicator = document.getElementById('thinkingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    async function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        addUserMessage(text);
        chatInput.value = '';

        if (!ai.isConfigured()) {
            addSystemMessage('IA nao configurada. Verifique o arquivo js/config.js');
            return;
        }

        showThinkingIndicator();

        try {
            const response = await ai.send(text);
            hideThinkingIndicator();
            addAIMessage(response);
        } catch (error) {
            hideThinkingIndicator();
            addSystemMessage('Erro da IA: ' + error.message);
        }
    }

    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendChatMessage());

    // Carrega contexto do hardware
    ai.loadContext();

    // Token tracker
    const tokenCount = document.getElementById('tokenCount');
    const tokenBarFill = document.getElementById('tokenBarFill');
    const requestCountEl = document.getElementById('requestCount');

    ai.onUsageUpdate = (usage) => {
        tokenCount.textContent = usage.tokens.toLocaleString('pt-BR');
        requestCountEl.textContent = usage.requests.toLocaleString('pt-BR');
        tokenBarFill.style.width = Math.min(usage.pct, 100) + '%';
        tokenBarFill.classList.remove('warning', 'danger');
        if (usage.pct > 80) tokenBarFill.classList.add('danger');
        else if (usage.pct > 50) tokenBarFill.classList.add('warning');
    };

    window.ChatUI = {
        addUserMessage,
        addAIMessage,
        addSystemMessage,
        showThinkingIndicator,
        hideThinkingIndicator,
        serial
    };

    updatePresentationMode();

    document.addEventListener('keydown', (event) => {
        const isPresentationShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p';
        if (!isPresentationShortcut) return;

        event.preventDefault();
        presentationModeEnabled = !presentationModeEnabled;
        updatePresentationMode();
    });

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
    presentationMediaQuery.addEventListener('change', updatePresentationMode);
    window.addEventListener('resize', () => {
        updatePresentationMode();
        setTimeout(() => term.fit?.(), 100);
    });

    // Verificação inicial
    if (!WebSerial.isSupported()) {
        connectBtn.disabled = true;
        addSystemMessage('Use Chrome, Edge ou Opera para conectar sua placa.');
    }
});
