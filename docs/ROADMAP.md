# Roadmap - BitDogLab AI Chat

## Fase 1: Fundacao
**Objetivo:** Projeto limpo, organizado, pronto para construir.

| Task | Agente | Status |
|------|--------|--------|
| Limpar projeto antigo | Kimi | Feito |
| Organizar repo (README, gitignore, skills) | Claude | Feito |
| Interface de chat responsiva | Kimi | Pendente |
| Arquivo de contexto do hardware | Claude | Pendente |
| Modulo de integracao IA (js/ai.js) | Claude | Pendente |

## Fase 2: Integracao
**Objetivo:** Chat funcionando end-to-end (usuario -> IA -> placa).

| Task | Agente | Status |
|------|--------|--------|
| Conectar chat com API de IA | Claude | Pendente |
| Renderizar codigo no chat | Kimi | Pendente |
| Botao "enviar para placa" | Claude + Kimi | Pendente |
| Terminal REPL funcional | Claude | Pendente |

## Fase 3: Polish
**Objetivo:** Experiencia de usuario refinada.

| Task | Agente | Status |
|------|--------|--------|
| Temas claro/escuro | Kimi | Pendente |
| Otimizar system prompt | Claude | Pendente |
| Deteccao de sensores I2C | Claude | Pendente |
| PWA / modo offline | Kimi + Claude | Pendente |

## Decisoes Tomadas
- [x] **Arquitetura:** 100% client-side, sem backend
- [x] **API key:** usuario insere na interface, salva no localStorage
- [x] **Formato:** todas as APIs candidatas sao compativeis com formato OpenAI (messages array)

## Decisoes Pendentes
- [ ] Qual API de IA usar? Candidatas: GLM, Minimax, Qwen ou Kimi (a definir)
