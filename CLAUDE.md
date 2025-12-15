# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MTG 20 Questions is an Angular application built with Firebase integration for authentication and data persistence. The app implements a 20-questions style game for Magic: The Gathering cards, where users try to guess a secret card through questions and answers. Questions are answered by GPT-4o-mini via OpenAI API.

## Common Commands

### Development
```bash
npm start              # Start dev server at localhost:4200
npm run watch          # Build in watch mode for development
```

### Testing
```bash
npm test               # Run Vitest unit tests
```

### Building
```bash
npm run build          # Production build to dist/mtg-20-questions/browser
```

### Firebase Functions
```bash
cd functions
npm run lint           # Lint functions code
npm run build          # Compile TypeScript to lib/
npm run serve          # Run Firebase emulators
npm run deploy         # Deploy functions to Firebase
```

### Firebase Deployment
```bash
firebase deploy                    # Deploy everything (hosting, functions, firestore)
firebase deploy --only hosting    # Deploy only the Angular app
firebase deploy --only functions  # Deploy only Cloud Functions
```

## Architecture

### Angular Configuration
- **Zoneless Change Detection**: Uses `provideZonelessChangeDetection()` instead of zone.js
- **Standalone Components**: All components are standalone (no NgModules)
- **Lazy Loading**: Routes use `loadComponent` for code splitting
- **Test Runner**: Vitest (not Karma/Jasmine)
- **Prettier**: 100 character line width, single quotes (configured in package.json)

### External APIs
- **Scryfall API**: Fetches random MTG cards (`https://api.scryfall.com/cards/random`)
- **OpenAI API**: GPT-4o-mini answers yes/no questions about the secret card

### Firebase Integration
- **Authentication**: Google Sign-In via Firebase Auth
- **Firestore**: User-scoped data persistence
- **Hosting**: Static hosting for Angular app
- **Functions**: `askQuestion` endpoint for LLM queries (uses Firebase secrets for OpenAI key)

### Data Model

Firestore structure is user-scoped with nested subcollections:
```
users/{userId}/
  └── games/{gameId}/
      ├── status: 'active' | 'won' | 'lost'
      ├── startedAt: Timestamp
      ├── secretCardData: SecretCardData (full Scryfall card object)
      └── turns/{turnId}/
          ├── question: string
          ├── answer: string
          ├── type: 'question' | 'guess'
          └── timestamp: Timestamp
```

See [game.model.ts](src/app/models/game.model.ts) for TypeScript interfaces.

### Routing

- `/` → redirects to `/game`
- `/login` → Login page (public)
- `/game` → Game dashboard (requires auth via `authGuard`)

### Services

**AuthService** ([auth.ts](src/app/services/auth.ts)):
- Google OAuth via `signInWithPopup`
- Exposes `user$` observable

**GameService** ([game.service.ts](src/app/services/game.service.ts)):
- CRUD for games/turns in Firestore
- Methods: `createGame()`, `getActiveGame()`, `getGameHistory()`, `addTurn()`, `getTurns()`, `updateGameStatus()`

**CardService** ([card.service.ts](src/app/services/card.service.ts)):
- Fetches random cards from Scryfall API

**LlmService** ([llm.service.ts](src/app/services/llm.service.ts)):
- Calls OpenAI API to answer questions about the secret card
- Uses client-side API key (development only)

**GameOrchestratorService** ([game-orchestrator.service.ts](src/app/services/game-orchestrator.service.ts)):
- Coordinates game flow: `startGame()`, `submitQuestion()`, `submitGuess()`
- Orchestrates CardService → GameService → LlmService

### Cloud Functions

**askQuestion** ([functions/src/index.ts](functions/src/index.ts)):
- POST endpoint for answering questions via OpenAI
- Uses Firebase secrets for `OPENAI_API_KEY`
- Example:
```bash
curl -X POST https://us-central1-mtg20-58a58.cloudfunctions.net/askQuestion \
    -H "Content-Type: application/json" \
    -d '{"secretCardData": {...}, "message": "Is this card red?"}'
```

## Important Patterns

### Dependency Injection
Uses Angular's modern `inject()` function instead of constructor injection:
```typescript
private firestore = inject(Firestore);
```

### File Naming
Component TypeScript files use `.ts` (not `.component.ts`). Example: `login.ts`, `header.ts`.

### Firebase Timestamp Usage
Use `Timestamp.now()` for creating timestamps, and `Timestamp` type from `@angular/fire/firestore`.

## Environment Setup

Create `src/environments/environment.ts` with:
```typescript
export const environment = {
  firebase: { /* Firebase config */ },
  openai: { apiKey: 'your-openai-key' }
};
```

For Cloud Functions, set the OpenAI secret:
```bash
firebase functions:secrets:set OPENAI_API_KEY
```

## Development Notes

- **Package Manager**: npm (specified: `npm@10.9.3`)
- **Node Version**: Functions require Node 24
- **Bundle Budgets**: Initial bundle max 1MB, component styles max 8kB
