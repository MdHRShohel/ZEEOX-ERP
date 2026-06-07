# Local Setup

## PostgreSQL in Docker, app locally

If PostgreSQL is not installed on your machine, start only the database in Docker:

```bash
docker compose -f docker-compose.db.yml up -d
```

The database will be available at:

```text
postgresql://postgres:postgres@localhost:5432/zeeox
```

Run the app locally with live reload:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## PostgreSQL option 2: Local install

Install PostgreSQL locally, then create a database named `zeeox` and use the same connection string values as in `.env.example`.

If you use a local PostgreSQL install instead of Docker, keep the same `.env` values and run the same app commands above.