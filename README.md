
# NOVA AI

NOVA AI is a personal AI assistant built with React, TypeScript, Express, and Capacitor.

## Features

- AI Chat Interface
- Multiple AI Model Support
- API Key Manager
- Personal Memory
- Learning Lab
- Knowledge Explorer
- Code Playground
- Android App Support

## Requirements

- Node.js 22+
- Bun
- Java 17
- Android Studio (for Android builds)

## Installation

Clone the repository:

```bash
git clone https://github.com/ksatish93357-cpu/Nova-1.git
cd Nova-1
```

Install dependencies:

```bash
bun install --frozen-lockfile
```

Create environment file:

```bash
cp .env.example .env
```

Add your API keys to `.env`.

Start development server:

```bash
bun run dev
```

## Web Build

```bash
bun run build
```

## Android APK Build

```bash
bun run build
bunx cap sync android
cd android
./gradlew assembleDebug
```

APK location:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Security

- Never commit `.env` files.
- Never expose API keys in frontend code.
- Configure CORS for trusted origins.
- Add authentication and rate limiting before public deployment.
- Use a real isolated sandbox for executing untrusted code.

## Backend Notice

The Android APK bundles the frontend, not the Express backend. API features need a separately hosted backend or a redesigned native API architecture.
