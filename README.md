# Hammametup

A gamified challenge and competition platform built with Next.js 14, Firebase, and modern web technologies.

## Features

- 🔥 **Next.js 14** with App Router
- 🎨 **Tailwind CSS** v3.3 for styling
- 🔐 **Firebase Authentication** and Firestore
- 📱 **PWA Support** with offline capabilities
- 🎯 **Real-time Updates** with Socket.io
- 📊 **Analytics & Charts** with Recharts
- 🗺️ **Maps Integration** with React Leaflet
- ✅ **Form Validation** with React Hook Form + Zod
- 🎭 **Animations** with Framer Motion
- 🎨 **UI Components** with shadcn/ui
- 📦 **State Management** with Zustand
- ⚡ **Redis Caching** for performance

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v3.3
- **UI Components:** shadcn/ui
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Caching:** Redis
- **Real-time:** Socket.io
- **Forms:** React Hook Form + Zod
- **State:** Zustand
- **Charts:** Recharts
- **Maps:** React Leaflet
- **Animations:** Framer Motion

## Project Structure

```
hammametup/
├── app/
│   ├── (auth)/          # Authentication routes
│   ├── (dashboard)/     # Protected dashboard routes
│   ├── api/             # API routes
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── challenges/      # Challenge-related components
│   ├── leaderboard/     # Leaderboard components
│   └── shared/          # Shared components
├── lib/
│   ├── firebase.ts      # Firebase client config
│   ├── firebase-admin.ts # Firebase admin config
│   ├── redis.ts         # Redis client
│   ├── utils.ts         # Utility functions
│   └── validations/     # Zod schemas
├── hooks/
│   └── useAuth.ts       # Authentication hook
├── store/
│   ├── auth.ts          # Auth state
│   └── challenges.ts    # Challenges state
└── public/              # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project
- Redis instance (optional, for caching)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hammametup
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Fill in your environment variables in `.env.local`:
   - Firebase configuration
   - Redis URL (optional)
   - Socket.io server URL

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build the application for production:

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Environment Variables

See `.env.local.example` for all required environment variables.

### Required:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Optional:
- `REDIS_URL` - For caching
- `NEXT_PUBLIC_SOCKET_URL` - For real-time features

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.
