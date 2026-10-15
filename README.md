# Service Desk (TicketOps)

Protótipo de gestão de chamados de TI com prioridade, responsável, interações e acompanhamento de prazo de atendimento (SLA).

## Stack

- Frontend: React, JavaScript e Vite
- Backend: Node.js e Express
- Persistência local: SQLite

## Funcionalidades

- Criação, listagem e atualização de chamados
- Histórico de interações por chamado
- Contagem regressiva de SLA por prioridade
- Filtros por status, prioridade e responsável

## Executar localmente

Requer Node.js e npm. No diretório `backend`, execute `npm install` e `npm run dev`. Na raiz do projeto, execute `npm install` e `npm run dev`. Abra a URL informada pelo Vite. O frontend usa `http://localhost:3001/api`.

## Estado do projeto

Este é um protótipo. Os usuários e senhas de demonstração estão definidos no frontend e não representam autenticação segura. O banco SQLite é local; não há implantação pública documentada.

Próximos passos: autenticação no backend, configuração da URL da API por ambiente e testes para regras de SLA.
