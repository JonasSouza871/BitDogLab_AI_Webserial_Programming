# BitDogLab AI Chat

Chatbot com IA para programar a BitDogLab direto pelo navegador via WebSerial.

## Problema

O fluxo atual para programar a BitDogLab em escolas e muito burocrtico:
1. Copiar documentacao do hardware (Word/PDF)
2. Colar numa LLM externa (ChatGPT, etc)
3. Copiar o codigo gerado
4. Abrir o Thonny (precisa estar instalado)
5. Colar e executar

Isso nao funciona em tablets, exige software instalado e e lento demais para criancas.

## Solucao

Uma interface de chat no navegador onde:
1. A crianca descreve o que quer ("faz o LED piscar vermelho")
2. A IA ja conhece todo o hardware da BitDogLab (contexto pre-carregado)
3. Gera o codigo MicroPython automaticamente
4. Envia direto para a placa via WebSerial -- sem instalar nada

## Arquitetura

```
Crianca <-> [Chat UI] <-> [API IA] <-> Codigo MicroPython
                |
          [WebSerial] <-> BitDogLab (RP2040)
```

## Stack

- **Frontend:** HTML/CSS/JS puro (responsivo, funciona em tablet)
- **Comunicacao:** WebSerial API (Chrome/Edge)
- **IA:** API externa (a definir -- Claude, OpenAI, Gemini)
- **Terminal:** xterm.js (visualizar output da placa)

## Estrutura do Projeto

```
/
├── index.html              # Interface principal (chat + terminal)
├── css/
│   └── style.css           # Estilos (responsivo)
├── js/
│   ├── webserial.js        # Classe WebSerial (comunicacao com placa)
│   └── app.js              # Logica da UI
├── lib/
│   └── xterm/              # Terminal xterm.js
├── context/
│   └── bitdoglab.md        # Contexto do hardware (system prompt da IA)
├── .agent/
│   ├── KIMI.md             # Skill do Agente 1 (Kimi)
│   └── CLAUDE.md           # Skill do Agente 2 (Claude)
└── docs/
    └── ROADMAP.md          # Roadmap e fases do projeto
```

## Compatibilidade

- Chrome 89+ / Edge 89+ / Opera 75+
- Firefox e Safari NAO suportam Web Serial API
- Responsivo: funciona em tablets (com adaptador USB OTG)

## Fluxo de Desenvolvimento (Multi-Agente)

Este projeto usa 2 agentes IA trabalhando em paralelo:

| Agente | Foco | Skill |
|--------|------|-------|
| **Kimi** (Agente 1) | Frontend, UI/UX, CSS, HTML | `.agent/KIMI.md` |
| **Claude** (Agente 2) | Backend, WebSerial, integracao IA, logica | `.agent/CLAUDE.md` |

### Regras de Versionamento

1. Cada task concluida = aviso ao usuario para testar
2. Usuario testa e pede o commit com nome
3. Commits sao feitos SOMENTE quando o usuario pede
4. Branch `main` = versao estavel
5. Nunca commitar arquivos de `.agent/`, `.env`, ou `node_modules/`

## Licenca

MIT
