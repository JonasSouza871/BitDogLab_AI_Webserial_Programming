/**
 * AI - Modulo de integracao com APIs de IA (OpenAI-compatible)
 * Configuracao vem do config.js (AI_CONFIG)
 */
class AI {
    constructor() {
        // Carrega config do config.js
        const cfg = typeof AI_CONFIG !== 'undefined' ? AI_CONFIG : {};
        this.apiKey = cfg.apiKey || '';
        this.baseUrl = cfg.baseUrl || '';
        this.model = cfg.model || '';
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
        return this.apiKey && this.apiKey !== 'SUA_API_KEY_AQUI' && this.baseUrl && this.model;
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
    async send(userMessage) {
        if (!this.isConfigured()) {
            throw new Error('API nao configurada. Verifique o arquivo js/config.js');
        }

        this.history.push({ role: 'user', content: userMessage });

        const messages = [
            { role: 'system', content: this.systemPrompt },
            ...this.history.slice(-this.maxHistory)
        ];

        const baseUrl = this.baseUrl.replace(/\/+$/, '');
        const url = `${baseUrl}/chat/completions`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API erro ${response.status}: ${errorData}`);
            }

            const data = await response.json();
            const fullResponse = data.choices[0].message.content;

            this.history.push({ role: 'assistant', content: fullResponse });

            if (this.history.length > this.maxHistory) {
                this.history = this.history.slice(-this.maxHistory);
            }

            return fullResponse;
        } catch (error) {
            this.history.pop();
            throw error;
        }
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
