/**
 * AI - Modulo de integracao com APIs de IA (OpenAI-compatible)
 * Configuracao vem do config.js (AI_CONFIG)
 */
class AI {
    constructor() {
        // Carrega config do config.js (local) ou usa proxy (produção)
        const cfg = typeof AI_CONFIG !== 'undefined' ? AI_CONFIG : {};
        this.apiKey = cfg.apiKey || '';
        this.baseUrl = cfg.baseUrl || '';
        this.model = cfg.model || '';
        this.useProxy = !this.apiKey;
        this.systemPrompt = '';
        this.musicContext = '';
        this.history = [];
        this.maxHistory = 4;
        this.musicKeywords = /musica|música|tocar|melodia|song|buzzer|nota|jingle|natal|natalina|sao joao|são joão|parabens|parabéns|baby|bieber|star wars|harry potter|mario|piratas|beethoven|despacito|asa branca|balao|balão|brilha|estrelinha|fur elise|imperial/i;
        this.tokensUsed = 0;
        this.requestCount = 0;
        this.dailyLimit = 14400;
        this.onUsageUpdate = null;
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
        try {
            const response = await fetch('context/musicas.md');
            this.musicContext = await response.text();
        } catch (error) {
            this.musicContext = '';
        }
    }

    /**
     * Verifica se a API esta configurada
     */
    isConfigured() {
        return this.useProxy || (this.apiKey && this.apiKey !== 'SUA_API_KEY_AQUI' && this.baseUrl && this.model);
    }

    /**
     * Limpa historico de conversa
     */
    clearHistory() {
        this.history = [];
    }

    /**
     * Envia mensagem para a IA e retorna resposta
     */
    async send(userMessage, _retry = 0) {
        if (!this.isConfigured()) {
            throw new Error('API nao configurada. Verifique o arquivo js/config.js');
        }

        if (_retry === 0) {
            this.history.push({ role: 'user', content: userMessage });
        }

        const isMusic = this.musicKeywords.test(userMessage);
        const prompt = isMusic && this.musicContext
            ? this.systemPrompt + '\n\n' + this.musicContext
            : this.systemPrompt;

        const messages = [
            { role: 'system', content: prompt },
            ...this.history.slice(-this.maxHistory)
        ];

        try {
            let response;
            if (this.useProxy) {
                response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages })
                });
            } else {
                const baseUrl = this.baseUrl.replace(/\/+$/, '');
                response = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({ model: this.model, messages })
                });
            }

            if (response.status === 429 && _retry < 2) {
                await new Promise(r => setTimeout(r, 10000));
                return this.send(userMessage, _retry + 1);
            }

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API erro ${response.status}: ${errorData}`);
            }

            const data = await response.json();
            const fullResponse = data.choices[0].message.content;

            if (data.usage) {
                this.tokensUsed += data.usage.total_tokens || 0;
                this.requestCount++;
                if (this.onUsageUpdate) this.onUsageUpdate(this.getUsage());
            }

            this.history.push({ role: 'assistant', content: fullResponse });

            if (this.history.length > this.maxHistory) {
                this.history = this.history.slice(-this.maxHistory);
            }

            return fullResponse;
        } catch (error) {
            if (_retry === 0) this.history.pop();
            throw error;
        }
    }

    getUsage() {
        return {
            tokens: this.tokensUsed,
            requests: this.requestCount,
            dailyLimit: this.dailyLimit,
            pct: Math.min(100, (this.requestCount / this.dailyLimit) * 100)
        };
    }

    /**
     * Extrai blocos de codigo MicroPython da resposta
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

// Instancia global
window.ai = new AI();
