# BJP Keep

BJP Keep is a simple home inventory management system designed to help track where items are stored around the house.

Features include:

- Room and cabinet management
- Inventory item tracking
- Item photos and image gallery
- QR Code generation for cabinets
- Item search and filtering
- Item move history and activity logs
- Responsive web interface
- SQLite database
- Docker and Synology NAS support

---

## Technology Stack

- Next.js 16
- React
- TypeScript
- Prisma ORM
- SQLite
- Tailwind CSS
- Canvas (QR Code generation)

---

## Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Database

Generate Prisma client:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

## Docker

Build image:

```bash
docker build -t bjpkeep .
```

Run container:

```bash
docker run --rm \
  -p 3000:3000 \
  -e DATABASE_URL="file:/app/prisma/bjpkeep.db" \
  bjpkeep
```

---

## Docker Compose

```bash
docker compose up --build
```

Persistent data:

```text
/data
├── bjpkeep.db
└── uploads
    └── items
```

Environment variables:

```env
DATABASE_URL=file:/data/bjpkeep.db
UPLOAD_DIR=/data/uploads/items
```

---

## Synology NAS Deployment

BJP Keep has been tested in Docker and is designed to run in Synology Container Manager.

Recommended persistent storage:

```text
/data
├── bjpkeep.db
└── uploads/items
```

---

## Roadmap

- Home Assistant Add-on
- Backup and restore tools
- Multi-user support
- Improved reporting and analytics
- Mobile-friendly enhancements

---

## License

Private project for personal home inventory management.
