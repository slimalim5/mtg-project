# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MTG 20 Questions is an Angular application built with Firebase integration for authentication and data persistence. The app implements a 20-questions style game for Magic: The Gathering cards, where users try to guess a secret card through questions and answers.

## Common Commands

### Development
```bash
npm start              # Start dev server at localhost:4200
ng serve              # Alternative to npm start
ng build --watch      # Build in watch mode for development
```

### Testing
```bash
npm test              # Run Vitest unit tests
ng test               # Alternative to npm test
```

### Building
```bash
npm run build         # Production build to dist/mtg-20-questions/browser
ng build              # Alternative build command
```

### Code Generation
```bash
ng generate component component-name    # Generate new component
ng generate service service-name        # Generate new service
ng generate --help                      # List all available schematics
```

### Firebase Functions
```bash
cd functions
npm run lint          # Lint functions code
npm run build         # Compile TypeScript to lib/
npm run serve         # Run Firebase emulators
npm run deploy        # Deploy functions to Firebase
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
- **Prettier**: Configured with 100 character line width and single quotes

### Firebase Integration
The app uses Angular Fire for Firebase integration:
- **Authentication**: Google Sign-In via Firebase Auth
- **Firestore**: Cloud Firestore for data persistence
- **Hosting**: Static hosting via Firebase Hosting
- **Functions**: Backend logic (currently minimal setup in `functions/`)

### Data Model

Firestore structure is user-scoped with nested subcollections:
```
users/{userId}/
  └── games/{gameId}/
      ├── status: 'active' | 'won' | 'lost'
      ├── startedAt: Timestamp
      ├── secretCardData: { name, mana_cost, type_line, oracle_text }
      └── turns/{turnId}/
          ├── question: string
          ├── answer: string
          ├── type: 'question' | 'guess'
          └── timestamp: Timestamp
```

See [game.model.ts](src/app/models/game.model.ts) for TypeScript interfaces.

### Security

**Firestore Rules**: Users can only read/write their own data under `/users/{userId}`. Auth is required for all operations. See [firestore.rules](firestore.rules).

**Auth Guard**: The `/game` route is protected by `authGuard` which redirects unauthenticated users to `/login`. See [auth-guard.ts](src/app/guards/auth-guard.ts).

**Environment Variables**: Firebase config is in `src/environments/environment.ts` (gitignored). You'll need to create this file with valid Firebase credentials.

### Routing

- `/` → redirects to `/game`
- `/login` → Login page (public)
- `/game` → Game dashboard (requires auth)

All routes use lazy loading with standalone components. See [app.routes.ts](src/app/app.routes.ts).

### Services

**AuthService** ([auth.ts](src/app/services/auth.ts)):
- Handles Google OAuth via `signInWithPopup`
- Exposes `user$` observable for auth state
- Methods: `loginWithGoogle()`, `logout()`

**GameService** ([game.service.ts](src/app/services/game.service.ts)):
- CRUD operations for games and turns
- Scoped to authenticated user's Firestore path
- Methods: `createGame()`, `getActiveGame()`, `getGameHistory()`, `addTurn()`, `getTurns()`

## Important Patterns

### Dependency Injection
Uses Angular's modern `inject()` function instead of constructor injection:
```typescript
private firestore = inject(Firestore);
```

### File Extensions
Component TypeScript files use `.ts` (not `.component.ts`). Example: `login.ts`, `header.ts`.

### Component Structure
Components are colocated with their templates and tests:
```
src/app/components/login/
  ├── login.ts
  ├── login.html
  └── login.spec.ts
```

### Firebase Timestamp Usage
Always use `Timestamp.now()` for creating timestamps, and `Timestamp` type from `@angular/fire/firestore` for typing.

## Development Notes

- **Package Manager**: npm (specified in package.json: `npm@10.9.3`)
- **Node Version**: Functions require Node 24 (see functions/package.json)
- **Bundle Budgets**: Initial bundle max 1MB, component styles max 8kB (see angular.json)
- **Formatter**: Code should be formatted with Prettier using the config in package.json
