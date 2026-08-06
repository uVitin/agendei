# 01 — Requisitos e modelagem do banco

> Documento vivo. Registra o escopo do MVP, as regras de negócio e o desenho do banco.

## 1. Problema

Profissionais autônomos gerenciam agenda por WhatsApp. Isso gera três dores:
marcação em horário já ocupado, tempo perdido respondendo "tem vaga quinta?",
e ausência de histórico. O Agendei entrega ao profissional um **link público**
que resolve as três.

## 2. Atores

| Ator             | Autenticado? | O que faz                                                   |
| ---------------- | ------------ | ----------------------------------------------------------- |
| **Profissional** | Sim          | Cria conta, cadastra serviços, define expediente, vê agenda |
| **Cliente**      | Não          | Acessa o link público, escolhe serviço e horário, agenda    |

Decisão: o cliente **não** cria conta no MVP. Cada agendamento guarda nome e
contato dele direto no registro. Isso remove uma barreira enorme de conversão
(ninguém quer criar conta pra marcar um corte de cabelo).

## 3. Escopo do MVP

### Dentro

- Cadastro e login do profissional (e-mail + senha, JWT).
- CRUD de serviços: nome, duração em minutos, preço.
- Definição de expediente semanal (ex.: seg–sex, 09h–18h).
- Página pública em `/{slug}` com os serviços do profissional.
- Cálculo de horários disponíveis por dia e por serviço.
- Criação de agendamento pelo cliente.
- Listagem e cancelamento de agendamentos pelo profissional.

### Fora (fica para depois do MVP)

Pagamento online, lembrete por e-mail/WhatsApp, múltiplos profissionais por conta,
bloqueios pontuais de agenda (férias, almoço), reagendamento pelo cliente,
intervalo entre atendimentos (buffer), recorrência.

## 4. Regras de negócio

| #    | Regra                                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------- |
| RN01 | Um agendamento nunca pode se sobrepor a outro **confirmado** do mesmo profissional.                      |
| RN02 | O agendamento tem que caber inteiro dentro de um bloco de expediente — início **e** fim.                 |
| RN03 | Não se agenda no passado.                                                                                |
| RN04 | A duração do agendamento vem do serviço, não do cliente: `ends_at = starts_at + duration_minutes`.       |
| RN05 | Serviço inativo não aparece na página pública nem aceita novo agendamento.                               |
| RN06 | Cancelar libera o horário: o registro permanece com `status = 'cancelled'` e deixa de bloquear a agenda. |
| RN07 | Todo cálculo de horário acontece no fuso do profissional; o banco guarda tudo em UTC.                    |

## 5. O motor de disponibilidade

O coração do produto. Entrada: `profissional`, `serviço`, `data`.
Saída: lista de horários livres.

```
1. Buscar os blocos de expediente do profissional naquele dia da semana.
2. Para cada bloco, gerar slots candidatos partindo do início do bloco,
   avançando de `duration_minutes` em `duration_minutes`.
3. Descartar todo slot cujo fim ultrapasse o fim do bloco.        (RN02)
4. Descartar todo slot que já começou (comparando com "agora").   (RN03)
5. Descartar todo slot que se sobreponha a um agendamento
   confirmado — a sobreposição ocorre quando
   `slot.inicio < agendamento.fim` E `slot.fim > agendamento.inicio`.  (RN01)
6. Devolver o que sobrou.
```

**Decisão sobre o passo dos slots:** no MVP o passo é igual à duração do serviço.
Um serviço de 30 min num expediente 09h–18h gera 09:00, 09:30, 10:00…
É previsível, fácil de testar e não fragmenta a agenda. A alternativa
(grade fixa de 15 min, permitindo 09:00, 09:15, 09:30…) dá mais opção ao cliente
mas cria buracos na agenda do profissional. Fica como evolução configurável.

**Por que essa função é o alvo dos testes unitários:** ela é pura — recebe dados,
devolve dados, não toca no banco. Dá pra cobrir virada de meia-noite, horário de
verão, serviço mais longo que o expediente e agenda lotada sem subir nada.

## 6. Modelo de dados

```
professionals ──1:N──> services ──1:N──> appointments
      │                                        ▲
      └──1:N──> working_hours                  │
      └────────────────1:N─────────────────────┘
```

### 6.1 DDL

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- permite '=' dentro de EXCLUDE

-- Profissionais (os usuários autenticados do sistema)
CREATE TABLE professionals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  slug          TEXT        NOT NULL UNIQUE,
  timezone      TEXT        NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT professionals_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

-- Serviços oferecidos
CREATE TABLE services (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  UUID        NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  duration_minutes INTEGER     NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  price_cents      INTEGER     NOT NULL CHECK (price_cents >= 0),
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_professional ON services (professional_id);

-- Expediente semanal (0 = domingo ... 6 = sábado)
CREATE TABLE working_hours (
  id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID     NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  weekday         SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time      TIME     NOT NULL,
  end_time        TIME     NOT NULL,
  CONSTRAINT working_hours_valid_range CHECK (end_time > start_time),
  CONSTRAINT working_hours_unique UNIQUE (professional_id, weekday, start_time)
);

CREATE INDEX idx_working_hours_professional ON working_hours (professional_id, weekday);

-- Agendamentos
CREATE TYPE appointment_status AS ENUM ('confirmed', 'cancelled');

CREATE TABLE appointments (
  id              UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID               NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id      UUID               NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  client_name     TEXT               NOT NULL,
  client_email    TEXT,
  client_phone    TEXT,
  starts_at       TIMESTAMPTZ        NOT NULL,
  ends_at         TIMESTAMPTZ        NOT NULL,
  status          appointment_status NOT NULL DEFAULT 'confirmed',
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT now(),
  CONSTRAINT appointments_valid_range CHECK (ends_at > starts_at),
  CONSTRAINT appointments_has_contact CHECK (client_email IS NOT NULL OR client_phone IS NOT NULL)
);

CREATE INDEX idx_appointments_agenda ON appointments (professional_id, starts_at);

-- ⭐ A regra RN01 gravada no próprio banco:
-- dois agendamentos confirmados do mesmo profissional não podem
-- ter intervalos de tempo que se cruzem.
ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    professional_id                       WITH =,
    tstzrange(starts_at, ends_at, '[)')   WITH &&
  ) WHERE (status = 'confirmed');
```

### 6.2 Por que cada decisão

**`UUID` em vez de `SERIAL`.** IDs sequenciais expõem volume de negócio
(`/appointments/47` conta quantos clientes você tem) e permitem varredura da API.
UUID também deixa a API gerar o ID antes de gravar, o que ajuda em fila e retry.

**`TIMESTAMPTZ` em tudo.** O tipo guarda o instante em UTC e converte na leitura.
`TIMESTAMP` sem fuso é a origem de metade dos bugs de agenda do mundo —
no horário de verão, dois eventos diferentes viram o mesmo horário.
O fuso do profissional fica em `professionals.timezone` e é usado só na hora de
montar a grade de slots.

**`price_cents INTEGER` em vez de `DECIMAL`.** Dinheiro em ponto flutuante é
erro clássico. Guardar centavos como inteiro elimina arredondamento; a formatação
para "R$ 50,00" é responsabilidade da interface.

**`ON DELETE CASCADE` no profissional, `RESTRICT` no serviço.** Apagar a conta
apaga tudo que é dela. Mas apagar um serviço que tem agendamento no histórico
deve ser **bloqueado** — por isso o serviço tem `is_active`: desativa, não apaga.

**`ends_at` gravado em vez de calculado.** É redundante com
`starts_at + service.duration_minutes`, mas de propósito: se o profissional mudar
a duração do serviço amanhã, os agendamentos já feitos precisam manter a duração
que foi combinada com o cliente. E o `EXCLUDE` precisa das duas pontas na tabela.

**A constraint `EXCLUDE` — o destaque técnico.** Validar sobreposição só na API
tem uma janela de corrida: dois clientes pedem o mesmo horário no mesmo
milissegundo, ambos passam pela checagem, ambos gravam. A constraint fecha essa
janela no nível do banco — a segunda inserção **falha**, sempre. A API trata esse
erro específico e responde `409 Conflict`. Validação na aplicação é UX;
constraint no banco é garantia.

O `WHERE (status = 'confirmed')` faz a constraint ignorar cancelados, atendendo
a RN06. E o `'[)'` no `tstzrange` deixa o intervalo aberto no fim: um agendamento
que termina 10:00 não conflita com outro que começa 10:00.

## 7. Endpoints previstos

| Método       | Rota                                          | Acesso  |
| ------------ | --------------------------------------------- | ------- |
| POST         | `/auth/register`                              | Público |
| POST         | `/auth/login`                                 | Público |
| GET          | `/me`                                         | Privado |
| GET/POST     | `/services`                                   | Privado |
| PATCH/DELETE | `/services/:id`                               | Privado |
| GET/PUT      | `/working-hours`                              | Privado |
| GET          | `/appointments`                               | Privado |
| PATCH        | `/appointments/:id/cancel`                    | Privado |
| GET          | `/public/:slug`                               | Público |
| GET          | `/public/:slug/availability?serviceId=&date=` | Público |
| POST         | `/public/:slug/appointments`                  | Público |

## 8. Próxima fase

Fase 2 — API em TypeScript rodando em Docker, com este schema virando migration
versionada e o motor de disponibilidade coberto por testes.
