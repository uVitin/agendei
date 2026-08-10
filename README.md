# Agendei

SaaS de agendamento online para profissionais autônomos — barbeiros, dentistas, psicólogos, personal trainers.

O profissional cria a conta, cadastra os serviços que oferece e define seu expediente.
O sistema gera um **link público** onde o cliente escolhe o serviço, vê apenas os horários
realmente disponíveis e confirma o agendamento — sem cadastro, sem telefonema e sem risco
de choque de horário.

## Status

| Fase | Escopo                                | Situação        |
| ---- | ------------------------------------- | --------------- |
| 1    | Requisitos e modelagem do banco       | ✅ Concluída    |
| 2    | API em Node + TypeScript sobre Docker | ✅ Concluída    |
| 3    | Front-end em Next.js                  | 🚧 Em andamento |
| 4    | Testes, CI/CD e deploy                | ⏳ Planejada    |

## Stack

| Camada        | Tecnologia                          |
| ------------- | ----------------------------------- |
| Back-end      | Node.js 24 · TypeScript · Express 5 |
| Banco         | PostgreSQL 16                       |
| Validação     | Zod                                 |
| Autenticação  | JWT · bcrypt                        |
| Datas e fusos | Luxon                               |
| Migrations    | node-pg-migrate (SQL versionado)    |
| Infra         | Docker · Docker Compose             |
| Front-end     | Next.js · TypeScript                |

## Destaques técnicos

### Impossível criar choque de horário

A regra mais crítica do produto é garantida em **duas camadas independentes**.

A primeira é a aplicação: o horário solicitado precisa ser exatamente um dos slots que o
motor de disponibilidade ofereceu. Isso cobre expediente, duração do serviço, horários
passados e conflitos — tudo com uma única verificação, porque reutiliza o mesmo motor
que gerou a lista.

A segunda é o próprio PostgreSQL:

```sql
ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    professional_id                     WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'confirmed');
```

Validação na aplicação tem uma janela de corrida de milissegundos entre "consultei" e
"gravei". A constraint fecha essa janela: sob requisições simultâneas, a segunda inserção
**falha sempre**. A API traduz o erro `23P01` do Postgres num honesto `409 Conflict`.

O intervalo `'[)'` é fechado no início e aberto no fim — um atendimento que termina às
10:30 não conflita com outro que começa às 10:30.

### Motor de disponibilidade como função pura

O cálculo de horários livres vive em [`src/core/availability.ts`](apps/api/src/core/availability.ts):
sem banco, sem HTTP, sem `new Date()` interno. O instante atual é **injetado** como
parâmetro, o que torna possível testar "não oferecer horário no passado" de forma
determinística — o teste diz qual é o "agora" e o resultado é sempre o mesmo.

Toda aritmética de tempo passa pela Luxon, com o fuso do profissional. O banco armazena
`TIMESTAMPTZ` (UTC); a conversão acontece numa fronteira só.

### Cancelar devolve o horário sem código extra

Cancelamento não apaga o registro, muda o `status`. Como a constraint e a consulta de
horários ocupados filtram por `status = 'confirmed'`, o horário volta para a agenda
pública automaticamente — e o histórico do cliente é preservado.

### Ambiente conteinerizado de ponta a ponta

`docker compose up` sobe banco, aplica as migrations e inicia a API, nessa ordem, sem
precisar de Node instalado na máquina. A imagem usa build em dois estágios: o compilador
TypeScript e o código-fonte ficam no estágio de build e não chegam à imagem final, que
roda como usuário sem privilégios.

## Arquitetura

```
agendei/
├── apps/
│   ├── api/
│   │   ├── migrations/          # SQL versionado
│   │   └── src/
│   │       ├── core/            # Regra de negócio pura (sem framework)
│   │       ├── config/          # Variáveis de ambiente validadas
│   │       ├── database/        # Pool de conexões
│   │       ├── modules/         # auth · services · working-hours
│   │       │                    # appointments · public
│   │       └── shared/          # Erros, middlewares, utilitários
│   └── web/                     # Next.js (Fase 3)
├── docs/                        # Decisões de arquitetura
└── docker-compose.yml
```

Cada módulo segue a mesma divisão de responsabilidades:

```
schemas     → contrato de entrada (Zod)
repository  → acesso ao banco (SQL parametrizado)
service     → regra de negócio
controller  → tradução HTTP
routes      → montagem dos middlewares
```

O `controller` não sabe o que é SQL e o `service` não sabe o que é HTTP. É essa separação
que permite testar a regra de negócio sem subir servidor.

## Como rodar

Pré-requisitos: Docker e Docker Compose.

```bash
cp .env.example .env    # preencha os valores
docker compose up -d --build
```

A API sobe em `http://localhost:3333` e o PostgreSQL em `localhost:5439`.

```bash
curl http://localhost:3333/health
```

Para derrubar:

```bash
docker compose down       # mantém os dados
docker compose down -v    # apaga o volume também
```

## Desenvolvimento

Com o banco em container e a API na máquina (recarrega a cada save):

```bash
docker compose up -d db
cd apps/api
npm install
npm run dev
```

| Comando                          | O que faz                                     |
| -------------------------------- | --------------------------------------------- |
| `npm run dev`                    | API em modo watch (não checa tipos)           |
| `npm run typecheck`              | Verificação de tipos — rode antes de commitar |
| `npm run build`                  | Compila para `dist/`                          |
| `npm run migrate:up`             | Aplica migrations pendentes                   |
| `npm run migrate:down`           | Desfaz a última migration                     |
| `npm run migrate:create -- nome` | Cria uma migration nova                       |

> `tsx` transpila sem verificar tipos. Erro de tipagem só aparece no `typecheck` ou no
> build — por isso o `typecheck` é etapa obrigatória do CI.

## API

Referência completa em [`docs/02-api.md`](docs/02-api.md).

| Método           | Rota                         | Acesso      |
| ---------------- | ---------------------------- | ----------- |
| `GET`            | `/health`                    | Público     |
| `POST`           | `/auth/register`             | Público     |
| `POST`           | `/auth/login`                | Público     |
| `GET`            | `/auth/me`                   | Autenticado |
| `GET` `POST`     | `/services`                  | Autenticado |
| `PATCH` `DELETE` | `/services/:id`              | Autenticado |
| `GET` `PUT`      | `/working-hours`             | Autenticado |
| `GET`            | `/appointments`              | Autenticado |
| `PATCH`          | `/appointments/:id/cancel`   | Autenticado |
| `GET`            | `/public/:slug`              | Público     |
| `GET`            | `/public/:slug/availability` | Público     |
| `POST`           | `/public/:slug/appointments` | Público     |

## Documentação

- [01 — Requisitos e modelagem do banco](docs/01-requisitos-e-modelagem.md)
- [02 — Referência da API](docs/02-api.md)
