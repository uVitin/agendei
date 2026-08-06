# Agendei

SaaS de agendamento online para profissionais autônomos (barbeiros, dentistas, psicólogos, personal trainers).

O profissional cria sua conta, cadastra os serviços que oferece e define seu expediente.
O sistema gera um **link público** onde o cliente escolhe o serviço, vê apenas os horários
realmente disponíveis e confirma o agendamento — sem cadastro, sem telefonema, sem choque de horário.

## Status

🚧 Em desenvolvimento — Fase 1 (requisitos e modelagem).

## Stack

| Camada    | Tecnologia                         |
| --------- | ---------------------------------- |
| Back-end  | Node.js + TypeScript + Express     |
| Banco     | PostgreSQL 16                      |
| Front-end | Next.js (App Router) + TypeScript  |
| Infra     | Docker + Docker Compose            |
| Testes    | Vitest (unitários e de integração) |
| CI/CD     | GitHub Actions                     |

## Destaques técnicos

- **Motor de disponibilidade**: cálculo de horários livres a partir do expediente,
  da duração do serviço e dos agendamentos já existentes.
- **Garantia anti-choque em duas camadas**: validação na API + constraint `EXCLUDE`
  com `tstzrange` no PostgreSQL, que torna a sobreposição de horários
  _impossível_ mesmo sob requisições concorrentes.
- **Ambiente 100% conteinerizado**: `docker compose up` sobe banco e API.
- **Suíte de testes** focada na lógica de datas e fusos horários.

## Estrutura

```
agendei/
├── apps/
│   ├── api/     # API REST (Node + TypeScript)
│   └── web/     # Interface (Next.js)
└── docs/        # Decisões de arquitetura e modelagem
```

## Documentação

- [01 — Requisitos e modelagem do banco](docs/01-requisitos-e-modelagem.md)

## Como rodar

_Instruções serão adicionadas na Fase 2._
