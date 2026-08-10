# 02 — Referência da API

Base local: `http://localhost:3333`

Rotas autenticadas exigem o header:

```
Authorization: Bearer <token>
```

Valores monetários trafegam em **centavos** (`5000` = R$ 50,00).
Instantes trafegam em **ISO-8601 UTC** (`2026-08-17T12:00:00.000Z`).

---

## Contrato de erro

Toda falha responde no mesmo formato.

Erro de negócio:

```json
{ "message": "Este horário não está disponível.", "code": "SLOT_UNAVAILABLE" }
```

Erro de validação (`422`):

```json
{
  "message": "Dados inválidos.",
  "issues": [
    { "field": "durationMinutes", "message": "Duração mínima de 5 minutos" }
  ]
}
```

| Código                   | HTTP | Quando acontece                                          |
| ------------------------ | ---- | -------------------------------------------------------- |
| `EMAIL_IN_USE`           | 409  | E-mail já cadastrado                                     |
| `INVALID_CREDENTIALS`    | 401  | E-mail ou senha incorretos                               |
| `TOKEN_MISSING`          | 401  | Header `Authorization` ausente                           |
| `TOKEN_INVALID`          | 401  | Token adulterado ou expirado                             |
| `SERVICE_NOT_FOUND`      | 404  | Serviço inexistente, de outro dono ou inativo            |
| `PROFESSIONAL_NOT_FOUND` | 404  | Slug público inexistente                                 |
| `APPOINTMENT_NOT_FOUND`  | 404  | Agendamento inexistente ou de outro profissional         |
| `ALREADY_CANCELLED`      | 409  | Agendamento já estava cancelado                          |
| `SLOT_UNAVAILABLE`       | 409  | Horário fora da grade, no passado ou já ocupado          |
| `SLOT_TAKEN`             | 409  | Horário preenchido por outra pessoa durante a requisição |
| `INVALID_RANGE`          | 422  | Período de consulta inconsistente                        |

> `SLOT_UNAVAILABLE` e `SLOT_TAKEN` são separados de propósito: o primeiro significa
> "você pediu algo que eu nunca ofereci"; o segundo, "você perdeu uma corrida por
> milissegundos". A frequência do segundo é uma métrica de disputa real pela agenda.

---

## Saúde

### `GET /health`

Responde `200` quando a API e o banco estão operacionais, `503` quando o banco não
responde. É o endpoint usado pelo healthcheck do Docker.

```json
{ "status": "ok", "database": "up", "uptimeSeconds": 384, "timestamp": "..." }
```

---

## Autenticação

### `POST /auth/register` · `201`

```json
{
  "name": "Barbearia do Vitor",
  "email": "vitor@teste.com",
  "password": "senha12345"
}
```

O `slug` público é gerado a partir do nome (`barbearia-do-vitor`), com sufixo numérico
em caso de colisão. A senha é armazenada como hash bcrypt.

```json
{
  "token": "eyJhbGciOi...",
  "professional": { "id": "...", "name": "...", "email": "...", "slug": "..." }
}
```

### `POST /auth/login` · `200`

```json
{ "email": "vitor@teste.com", "password": "senha12345" }
```

Responde no mesmo formato do registro. E-mail inexistente e senha errada retornam a
**mesma** mensagem, para não permitir descobrir quem tem conta no sistema.

### `GET /auth/me` · `200` · 🔒

Dados do profissional autenticado.

---

## Serviços 🔒

### `GET /services` · `200`

Lista os serviços do profissional, ativos primeiro.

### `POST /services` · `201`

```json
{ "name": "Corte de Cabelo", "durationMinutes": 30, "priceCents": 5000 }
```

Duração entre 5 e 480 minutos.

### `PATCH /services/:id` · `200`

Atualização parcial — envie apenas os campos que mudam.

```json
{ "priceCents": 5500 }
```

### `DELETE /services/:id` · `200`

**Desativa** o serviço (`isActive: false`) em vez de apagar, preservando o histórico de
agendamentos. Serviço inativo some da página pública.

---

## Expediente 🔒

### `GET /working-hours` · `200`

### `PUT /working-hours` · `200`

Substitui a semana inteira, numa transação. Dias da semana: `0` = domingo … `6` = sábado.

```json
{
  "blocks": [
    { "weekday": 1, "startTime": "09:00", "endTime": "18:00" },
    { "weekday": 6, "startTime": "09:00", "endTime": "12:00" },
    { "weekday": 6, "startTime": "14:00", "endTime": "17:00" }
  ]
}
```

Blocos separados no mesmo dia representam turnos com pausa. Sobreposição no mesmo dia é
rejeitada com `422`.

---

## Agenda do profissional 🔒

### `GET /appointments` · `200`

| Parâmetro | Padrão           | Descrição                         |
| --------- | ---------------- | --------------------------------- |
| `from`    | hoje             | Início do período (`YYYY-MM-DD`)  |
| `to`      | `from` + 30 dias | Fim do período                    |
| `status`  | `confirmed`      | `confirmed`, `cancelled` ou `all` |

```json
{
  "from": "2026-08-10",
  "to": "2026-09-09",
  "timezone": "America/Sao_Paulo",
  "total": 2,
  "appointments": [
    {
      "id": "...",
      "status": "confirmed",
      "startsAt": "2026-08-17T12:30:00.000Z",
      "label": "17/08/2026 às 09:30",
      "client": { "name": "Cliente B", "email": null, "phone": "11933334444" },
      "service": {
        "name": "Corte de Cabelo",
        "durationMinutes": 30,
        "priceCents": 5000
      }
    }
  ]
}
```

### `PATCH /appointments/:id/cancel` · `200`

Muda o status para `cancelled`. O horário volta imediatamente para a agenda pública.

---

## Rotas públicas

Sem autenticação — é o que o cliente final acessa.

### `GET /public/:slug` · `200`

Perfil do profissional e serviços ativos.

### `GET /public/:slug/availability` · `200`

| Parâmetro   | Obrigatório | Descrição                     |
| ----------- | ----------- | ----------------------------- |
| `serviceId` | sim         | UUID de um serviço ativo      |
| `date`      | sim         | Dia consultado (`YYYY-MM-DD`) |

```json
{
  "date": "2026-08-17",
  "timezone": "America/Sao_Paulo",
  "service": {
    "name": "Corte de Cabelo",
    "durationMinutes": 30,
    "priceCents": 5000
  },
  "slots": [
    {
      "startsAt": "2026-08-17T12:00:00.000Z",
      "endsAt": "2026-08-17T12:30:00.000Z",
      "label": "09:00"
    }
  ]
}
```

Os slots partem do início de cada bloco de expediente e avançam pela duração do serviço.
São excluídos os que ultrapassam o expediente, os que já passaram e os que cruzam
qualquer agendamento confirmado — **de qualquer serviço**, porque a agenda é do
profissional, não do serviço.

O `label` já vem convertido para o fuso do profissional.

### `POST /public/:slug/appointments` · `201`

```json
{
  "serviceId": "673ff877-...",
  "startsAt": "2026-08-17T12:00:00.000Z",
  "clientName": "Maria Silva",
  "clientPhone": "11988887777",
  "clientEmail": "maria@exemplo.com"
}
```

`clientEmail` e `clientPhone` são opcionais individualmente, mas **pelo menos um** é
obrigatório — a mesma regra existe como `CHECK` no banco.

O `startsAt` precisa ser exatamente um dos horários devolvidos por `/availability`.
Qualquer outro valor responde `409 SLOT_UNAVAILABLE`.
