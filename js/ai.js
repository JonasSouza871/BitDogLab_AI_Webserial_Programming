/**
 * AI - Modulo de integracao com APIs de IA (OpenAI-compatible)
 * Configuracao vem do config.js (AI_CONFIG)
 */
class AI {
    constructor() {
        // Carrega config do config.js (local) ou usa proxy (producao)
        const cfg = typeof AI_CONFIG !== 'undefined' ? AI_CONFIG : {};
        this.apiKey = cfg.apiKey || '';
        this.baseUrl = cfg.baseUrl || '';
        this.model = cfg.model || '';
        this.useProxy = !this.apiKey;
        this.systemPrompt = '';
        this.musicContext = '';
        this.matrixContext = '';
        this.history = [];
        this.maxHistory = 4;
        this.musicKeywords = /musica|m\u00fasica|tocar|melodia|song|buzzer|nota|jingle|natal|natalina|sao joao|s\u00e3o jo\u00e3o|parabens|parab\u00e9ns|baby|bieber|star wars|harry potter|mario|piratas|beethoven|despacito|asa branca|balao|bal\u00e3o|brilha|estrelinha|fur elise|imperial/i;
        this.matrixKeywords = /matriz|matrix|neopixel|5x5|emoji|emojis|desenho|desenhar|desenha|icone|\u00edcone|figura|simbolo|s\u00edmbolo|carinha|rostinho|rosto|feliz|triste|coracao|cora\u00e7\u00e3o|estrela|sol|lua|casa|casinha|flor|fantasma|gato|gatinho|cachorro|cachorrinho|seta|check|xis|heart|star|smile|sad|ghost|cat|dog|right|left|home|moon|sun|flower/i;
        this.matrixEmojiTriggers = [
            '\u2764\uFE0F',
            '\u2764',
            '\u2B50',
            '\uD83D\uDE00',
            '\uD83D\uDE42',
            '\uD83D\uDE22',
            '\uD83D\uDE41',
            '\uD83C\uDFE0',
            '\uD83C\uDF38',
            '\u2600\uFE0F',
            '\u2600',
            '\uD83C\uDF19',
            '\u27A1\uFE0F',
            '\u27A1',
            '\u2B05\uFE0F',
            '\u2B05',
            '\u2705',
            '\u274C',
            '\uD83D\uDC7B',
            '\uD83D\uDE3A',
            '\uD83D\uDC36'
        ];
        this.tokensUsed = 0;
        this.requestCount = 0;
        this.dailyLimit = 14400;
        this.onUsageUpdate = null;
    }

    /**
     * Carrega os contextos da BitDogLab
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

        try {
            const response = await fetch('context/matriz.md');
            this.matrixContext = await response.text();
        } catch (error) {
            this.matrixContext = '';
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
        const hasMatrixEmoji = this.matrixEmojiTriggers.some((emoji) => userMessage.includes(emoji));
        const isMatrixRequest = this.matrixKeywords.test(userMessage) || hasMatrixEmoji;

        const promptParts = [this.systemPrompt];
        if (isMusic && this.musicContext) {
            promptParts.push(this.musicContext);
        }
        if (isMatrixRequest && this.matrixContext) {
            promptParts.push(this.matrixContext);
        }
        const prompt = promptParts.join('\n\n');

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
