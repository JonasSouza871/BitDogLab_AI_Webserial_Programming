/**
 * AI - Modulo de integracao com APIs de IA (OpenAI-compatible)
 * Suporta: GLM, Minimax, Qwen, Kimi, OpenAI, etc.
 */
class AI {
    constructor() {
        this.apiKey = localStorage.getItem('ai_api_key') || '';
        this.baseUrl = localStorage.getItem('ai_base_url') || '';
        this.model = localStorage.getItem('ai_model') || '';
        this.systemPrompt = '';
        this.history = [];
        this.maxHistory = 10;
    }

    /**
     * Carrega o contexto do hardware da BitDogLab
     */
    async loadContext() {
        try {
            const response = await fetch('context/bitdoglab.md');
            this.systemPrompt = await response.text();
        } catch (error) {
            console.error('Erro ao carregar contexto:', error);
            this.systemPrompt = 'Voce e um assistente que gera codigo MicroPython para a BitDogLab (Raspberry Pi Pico).';
        }
    }

    /**
     * Verifica se a API esta configurada
     */
    isConfigured() {
        return this.apiKey && this.baseUrl && this.model;
    }

    /**
     * Salva configuracoes no localStorage
     */
    saveConfig(apiKey, baseUrl, model) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.model = model;
        localStorage.setItem('ai_api_key', apiKey);
        localStorage.setItem('ai_base_url', baseUrl);
        localStorage.setItem('ai_model', model);
    }

    /**
     * Retorna configuracoes atuais
     */
    getConfig() {
        return {
            apiKey: this.apiKey,
            baseUrl: this.baseUrl,
            model: this.model
        };
    }

    /**
     * Limpa configuracoes
     */
    clearConfig() {
        this.apiKey = '';
        this.baseUrl = '';
        this.model = '';
        localStorage.removeItem('ai_api_key');
        localStorage.removeItem('ai_base_url');
        localStorage.removeItem('ai_model');
    }

    /**
     * Limpa historico de conversa
     */
    clearHistory() {
        this.history = [];
    }

    /**
     * Envia mensagem para a IA e retorna resposta (streaming)
     * @param {string} userMessage - Mensagem do usuario
     * @param {function} onChunk - Callback chamado a cada chunk de texto recebido
     * @returns {string} Resposta completa
     */
    async send(userMessage, onChunk) {
        if (!this.isConfigured()) {
            throw new Error('API nao configurada. Clique no botao de configuracoes.');
        }

        // Adiciona mensagem ao historico
        this.history.push({ role: 'user', content: userMessage });

        // Monta as mensagens (system + historico recente)
        const messages = [
            { role: 'system', content: this.systemPrompt },
            ...this.history.slice(-this.maxHistory)
        ];

        // Normaliza URL base (remove trailing slash)
        const baseUrl = this.baseUrl.replace(/\/+$/, '');
        const url = `${baseUrl}/chat/completions`;

        const body = {
            model: this.model,
            messages: messages,
            stream: !!onChunk
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API erro ${response.status}: ${errorData}`);
            }

            let fullResponse = '';

            if (onChunk && response.body) {
                // Streaming: le chunk por chunk
                fullResponse = await this._readStream(response.body, onChunk);
            } else {
                // Sem streaming: resposta completa
                const data = await response.json();
                fullResponse = data.choices[0].message.content;
            }

            // Salva resposta no historico
            this.history.push({ role: 'assistant', content: fullResponse });

            // Limita historico
            if (this.history.length > this.maxHistory) {
                this.history = this.history.slice(-this.maxHistory);
            }

            return fullResponse;
        } catch (error) {
            // Remove a mensagem do usuario do historico se falhou
            this.history.pop();
            throw error;
        }
    }

    /**
     * Le stream SSE (Server-Sent Events) da API
     */
    async _readStream(body, onChunk) {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Processa linhas completas do SSE
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Ultima linha pode estar incompleta

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;

                const data = trimmed.slice(5).trim();
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta?.content;
                    if (delta) {
                        fullText += delta;
                        onChunk(delta);
                    }
                } catch (e) {
                    // Ignora linhas mal-formadas
                }
            }
        }

        return fullText;
    }

    /**
     * Extrai blocos de codigo MicroPython da resposta
     * @param {string} text - Texto da resposta da IA
     * @returns {Array<string>} Lista de blocos de codigo
     */
    static extractCode(text) {
        const codeBlocks = [];
        const regex = /```(?:python|micropython)?\s*\n([\s\S]*?)```/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            codeBlocks.push(match[1].trim());
        }

        return codeBlocks;
    }
}

// Presets de provedores conhecidos
AI.PROVIDERS = {
    kimi: {
        name: 'Kimi (Moonshot)',
        baseUrl: 'https://api.moonshot.cn/v1',
        models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
    },
    glm: {
        name: 'GLM (Zhipu)',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        models: ['glm-4-flash', 'glm-4', 'glm-4-plus']
    },
    qwen: {
        name: 'Qwen (Alibaba)',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        models: ['qwen-turbo', 'qwen-plus', 'qwen-max']
    },
    minimax: {
        name: 'Minimax',
        baseUrl: 'https://api.minimax.chat/v1',
        models: ['MiniMax-Text-01', 'abab6.5s-chat']
    },
    openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo']
    }
};

// Instancia global
window.ai = new AI();
