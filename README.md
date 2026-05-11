# LBASSUR API

Backend NestJS + Prisma + PostgreSQL for the LBASSUR insurance comparator.

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
npm run start:dev
```

API base URL:

```txt
http://localhost:4000/api
```

Swagger docs:

```txt
http://localhost:4000/docs
```

## Neon

Use the Neon pooler URL for `DATABASE_URL` and the direct URL for `DIRECT_URL`.

The `.env` file is ignored by Git. Do not commit real database credentials.
