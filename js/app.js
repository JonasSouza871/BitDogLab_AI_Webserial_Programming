/**
 * App - BitDogLab AI WebSerial
 * Frontend com syntax highlight e envio de código
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
            background: '#161221',
            foreground: '#f0f0f0',
            cursor: '#b829dd',
            selection: 'rgba(184, 41, 221, 0.3)'
        },
        fontSize: 14,
        fontFamily: 'SF Mono, Monaco, monospace',
        scrollback: 10000
    });

    term.open(document.getElementById('terminal'));
    
    // Mensagem inicial
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

    // Adiciona mensagem da IA com suporte a código
    function addAIMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        // Processa blocos de código
        const parts = text.split(/(```(?:python|micropython)?\s*\n[\s\S]*?```)/g);
        
        parts.forEach(part => {
            if (part.startsWith('```')) {
                // Extrai código
                const codeMatch = part.match(/```(?:python|micropython)?\s*\n([\s\S]*?)```/);
                if (codeMatch) {
                    const code = codeMatch[1].trim();
                    const codeBlock = createCodeBlock(code);
                    bubbleDiv.appendChild(codeBlock);
                }
            } else if (part.trim()) {
                // Texto normal
                const p = document.createElement('p');
                p.textContent = part.trim();
                bubbleDiv.appendChild(p);
            }
        });
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.appendChild(bubbleDiv);
        messageDiv.appendChild(timeSpan);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageDiv;
    }

    // Cria bloco de código com syntax highlight
    function createCodeBlock(code) {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';
        
        // Syntax highlight
        const highlightedCode = highlightPython(code);
        
        const pre = document.createElement('pre');
        const codeEl = document.createElement('code');
        codeEl.innerHTML = highlightedCode;
        pre.appendChild(codeEl);
        wrapper.appendChild(pre);
        
        // Botão enviar para placa
        const btn = document.createElement('button');
        btn.className = 'btn-send-code';
        btn.textContent = 'Enviar para placa';
        btn.addEventListener('click', () => sendCodeToBoard(code, btn));
        wrapper.appendChild(btn);
        
        return wrapper;
    }

    // Syntax highlight simples para Python
    function highlightPython(code) {
        return code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
            .replace(/\b(def|class|if|else|elif|for|while|try|except|finally|import|from|as|return|break|continue|pass|True|False|None|and|or|not|in|is|lambda|with|yield|async|await)\b/g, '<span class="keyword">$1</span>')
            .replace(/\b(print|len|range|str|int|float|list|dict|tuple|set|open|input|enumerate|zip|map|filter|sum|min|max|abs|round|type|isinstance|hasattr|getattr|setattr|dir|help)\b/g, '<span class="builtin">$1</span>')
            .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
            .replace(/(['"])(.*?)\1/g, '<span class="string">$&</span>');
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
            addSystemMessage('Código enviado com sucesso!');
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
            addSystemMessage('Configure a IA primeiro. Clique na engrenagem no header.');
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
            addSystemMessage('Preencha todos os campos.');
            return;
        }

        ai.saveConfig(apiKey, baseUrl, model);
        closeConfigModal();
        addSystemMessage('IA configurada! Pode conversar.');
    });

    // Carrega contexto do hardware
    ai.loadContext().then(() => {
        if (!ai.isConfigured()) {
            addSystemMessage('Configure a IA clicando na engrenagem.');
        }
    });

    window.ChatUI = {
        addUserMessage,
        addAIMessage,
        addSystemMessage,
        showThinkingIndicator,
        hideThinkingIndicator,
        serial
    };

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
