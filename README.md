# BatakScript 3D

> Platform pembelajaran interaktif Surat Batak Toba berbasis web dengan visualisasi 3D dan mesin transliterasi cerdas.

## Arsitektur Monorepo

```
ppw-2026-week6-12S24012/
├── server/          # Backend API — Golang (Gin + GORM + SQLite)
│   ├── handler/     # HTTP route handlers
│   ├── service/     # Business logic & transliteration engine
│   ├── repository/  # Database access layer
│   └── model/       # GORM data models
├── client/          # Frontend — Next.js (App Router, TypeScript, Tailwind CSS)
│   └── src/
│       └── app/
├── .gitignore
└── README.md
```

## Tech Stack

| Layer     | Teknologi |
|-----------|-----------|
| Backend   | Go 1.22+, Gin-Gonic, GORM, SQLite |
| Frontend  | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| 3D Engine | Three.js, @react-three/fiber, @react-three/drei |
| Canvas    | HTML5 2D Canvas API |

## Cara Menjalankan

### Backend
```bash
cd server
go run main.go
# Server berjalan di http://localhost:8080
```

### Frontend
```bash
cd client
npm run dev
# UI berjalan di http://localhost:3000
```

## API Endpoints

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/glyphs` | Daftar seluruh glyph Batak |
| `POST` | `/api/v1/transliterate` | Transliterasi Latin → Surat Batak Toba |
| `POST` | `/api/v1/progress` | Simpan progres belajar pengguna |