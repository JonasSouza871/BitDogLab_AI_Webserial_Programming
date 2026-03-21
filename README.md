---
title: BitDogLab AI WebSerial
emoji: 🐶
colorFrom: purple
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: AI-powered MicroPython code generator for BitDogLab V7
---

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
- **IA:** Llama 4 Scout (Meta, open-weight) via Groq
- **Terminal:** xterm.js (visualizar output da placa)

## Compatibilidade

- Chrome 89+ / Edge 89+ / Opera 75+
- Firefox e Safari NAO suportam Web Serial API
- Responsivo: funciona em tablets (com adaptador USB OTG)

## Licenca

MIT
