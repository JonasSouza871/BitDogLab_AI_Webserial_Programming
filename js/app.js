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
    term.writeln('\r\n\x1b[90m╔══════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[90m║\x1b[0m  BitDogLab AI - WebSerial Terminal              \x1b[90m║\x1b[0m');
    term.writeln('\x1b[90m╚══════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('\r\n\x1b[90m[*] Clique em "Conectar" para selecionar uma porta serial\x1b[0m');
    term.writeln('\x1b[90m[*] Compativel com MicroPython e BitDogLab\x1b[0m\r\n');

    // ==========================================
    // Callbacks do WebSerial
    // ==========================================
    serial.onData((data) => {
        term.write(data);
    });

    serial.onConnect(() => {
        updateUIState(true);
        term.writeln('\x1b[32m\r\n[Conectado]\x1b[0m');
        addSystemMessage('Placa conectada. Pronto para programar.');
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
        
        // Envia para a IA
        handleAIResponse(text);
    }

    async function handleAIResponse(userText) {
        if (!ai.isConfigured()) {
            addSystemMessage('IA nao configurada. Clique no botao * no header para configurar.');
            return;
        }

        // Cria bolha da IA vazia para streaming
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        const contentP = document.createElement('p');
        contentP.textContent = 'Pensando...';
        bubbleDiv.appendChild(contentP);
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = getCurrentTime();
        messageDiv.appendChild(bubbleDiv);
        messageDiv.appendChild(timeSpan);
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();

        try {
            let started = false;
            const fullResponse = await ai.send(userText, (chunk) => {
                if (!started) {
                    contentP.textContent = '';
                    started = true;
                }
                contentP.textContent += chunk;
                scrollToBottom();
            });

            // Apos streaming, renderiza com blocos de codigo clicaveis
            renderAIMessage(bubbleDiv, fullResponse);

        } catch (error) {
            contentP.textContent = 'Erro: ' + error.message;
            contentP.style.color = '#ff6b6b';
        }
    }

    function renderAIMessage(bubbleDiv, text) {
        bubbleDiv.innerHTML = '';

        // Divide texto em partes: texto normal e blocos de codigo
        const parts = text.split(/(```(?:python|micropython)?\s*\n[\s\S]*?```)/g);

        parts.forEach(part => {
            if (part.match(/^```(?:python|micropython)?\s*\n/)) {
                // Bloco de codigo
                const code = part.replace(/```(?:python|micropython)?\s*\n/, '').replace(/```$/, '').trim();

                const codeWrapper = document.createElement('div');
                codeWrapper.className = 'code-block';

                const pre = document.createElement('pre');
                const codeEl = document.createElement('code');
                codeEl.textContent = code;
                pre.appendChild(codeEl);
                codeWrapper.appendChild(pre);

                const btnSendCode = document.createElement('button');
                btnSendCode.className = 'btn btn-send-code';
                btnSendCode.textContent = 'Enviar para placa';
                btnSendCode.addEventListener('click', () => sendCodeToBoard(code, btnSendCode));
                codeWrapper.appendChild(btnSendCode);

                bubbleDiv.appendChild(codeWrapper);
            } else if (part.trim()) {
                const lines = part.trim().split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        const p = document.createElement('p');
                        p.textContent = line;
                        bubbleDiv.appendChild(p);
                    }
                });
            }
        });
    }

    async function sendCodeToBoard(code, button) {
        if (!serial.connected) {
            addSystemMessage('Placa nao conectada. Conecte via USB primeiro.');
            return;
        }

        button.textContent = 'Enviando...';
        button.disabled = true;

        try {
            // Ctrl+C para garantir que esta no REPL
            await serial.sendCtrlC();
            await sleep(100);

            // Entra no modo paste do MicroPython (Ctrl+E)
            await serial.write('\x05');
            await sleep(100);

            // Envia o codigo linha por linha
            const lines = code.split('\n');
            for (const line of lines) {
                await serial.write(line + '\r\n');
                await sleep(20);
            }

            // Sai do modo paste e executa (Ctrl+D)
            await serial.write('\x04');

            button.textContent = 'Enviado!';
            addSystemMessage('Codigo enviado para a placa!');
        } catch (error) {
            button.textContent = 'Erro ao enviar';
            addSystemMessage('Erro ao enviar codigo: ' + error.message);
        }

        setTimeout(() => {
            button.textContent = 'Enviar para placa';
            button.disabled = false;
        }, 2000);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
    // Modal de Configuracao da IA
    // ==========================================
    const configBtn = document.getElementById('configBtn');
    const configModal = document.getElementById('configModal');
    const configSaveBtn = document.getElementById('configSaveBtn');
    const configCancelBtn = document.getElementById('configCancelBtn');
    const providerSelect = document.getElementById('providerSelect');
    const configBaseUrl = document.getElementById('configBaseUrl');
    const configModelSelect = document.getElementById('configModel');
    const configModelCustom = document.getElementById('configModelCustom');
    const configApiKey = document.getElementById('configApiKey');

    function openConfigModal() {
        configModal.classList.remove('hidden');
        // Preenche com valores salvos
        const config = ai.getConfig();
        configBaseUrl.value = config.baseUrl;
        configApiKey.value = config.apiKey;
        configModelCustom.value = config.model;
    }

    function closeConfigModal() {
        configModal.classList.add('hidden');
    }

    configBtn.addEventListener('click', openConfigModal);
    configCancelBtn.addEventListener('click', closeConfigModal);
    configModal.querySelector('.modal-overlay').addEventListener('click', closeConfigModal);

    providerSelect.addEventListener('change', () => {
        const provider = AI.PROVIDERS[providerSelect.value];
        if (provider) {
            configBaseUrl.value = provider.baseUrl;
            // Popula modelos
            configModelSelect.innerHTML = '';
            provider.models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                configModelSelect.appendChild(opt);
            });
            configModelSelect.classList.remove('hidden');
            configModelCustom.classList.add('hidden');
        } else {
            // Custom
            configBaseUrl.value = '';
            configModelSelect.classList.add('hidden');
            configModelCustom.classList.remove('hidden');
            configModelCustom.value = '';
        }
    });

    configSaveBtn.addEventListener('click', () => {
        const baseUrl = configBaseUrl.value.trim();
        const apiKey = configApiKey.value.trim();
        const model = configModelCustom.classList.contains('hidden')
            ? configModelSelect.value
            : configModelCustom.value.trim();

        if (!baseUrl || !apiKey || !model) {
            addSystemMessage('Preencha todos os campos de configuracao.');
            return;
        }

        ai.saveConfig(apiKey, baseUrl, model);
        closeConfigModal();
        addSystemMessage('IA configurada! Pode comecar a conversar.');
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

    // Carrega contexto do hardware
    ai.loadContext().then(() => {
        if (!ai.isConfigured()) {
            addSystemMessage('Configure a IA clicando no botao * no header.');
        }
    });

    // Expose functions for external use
    window.ChatUI = {
        addUserMessage,
        addAIMessage,
        addSystemMessage,
        serial
    };
});
