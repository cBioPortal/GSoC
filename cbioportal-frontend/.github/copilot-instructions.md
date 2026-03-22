# GitHub Copilot Instructions for cBioPortal Frontend

## Project Overview

This repository contains the frontend code for cBioPortal, a comprehensive cancer genomics data visualization platform. The codebase uses React, MobX, and TypeScript.

## Architecture & Technology Stack

- **Framework**: React with TypeScript
- **State Management**: MobX
- **Build Tools**: Webpack, Yarn
- **Testing**: Jest with ts-jest
- **Code Formatting**: Prettier
- **Monorepo**: Lerna (with workspaces in `packages/`)

## Code Style & Standards

### TypeScript
- Use TypeScript for all new code
- Enable strict null checks and no implicit any
- Use ES6+ features (module target: es6)
- Use decorators (experimental decorators enabled)
- Follow the existing TypeScript configuration in `tsconfig.json`

### React Components
- Use functional components with hooks when possible
- For class components with state management, use MobX `@observer` decorator
- Use `@observable`, `@computed`, and `@action` decorators for MobX reactive state
- Keep components focused and single-purpose

### Code Formatting
- Use Prettier for code formatting (automatically runs on git commit)
- Configuration:
  - Tab width: 4 spaces
  - Single quotes
  - Trailing commas (ES5)
- Run `yarn run prettierFixLocal` if CircleCI prettier check fails

### File Organization
- Source code lives in `src/` directory
- Shared components: `src/shared/`
- Pages: `src/pages/`
- Configuration: `src/config/`
- Tests: Co-located with source files using `*.spec.ts` or `*.spec.tsx` extension

## Development Workflow

### Setup
1. Install dependencies: `yarn install --frozen-lockfile`
2. Build DLLs: `yarn run buildDLL:dev`
3. Build packages: `yarn run buildModules`
4. Start dev server: `yarn run start`

### Environment Variables
- Set `BRANCH_ENV` to `master` or `rc` based on the branch you're working from
- Custom API URLs can be configured in `env/custom.sh`

### Testing
- Run main project tests: `yarn run testMain`
- Run package tests: `yarn run testPackages`
- Run tests in watch mode: `yarn run test:watch`
- Use `GREP=filename.spec.js` to run specific test files
- Test files should be named `*.spec.ts` or `*.spec.tsx`
- Setup tests configuration is in `src/setupTests.ts`

### End-to-End Testing
- E2E tests can run against public instances (`remote`) or local dockerized backend (`local`)
- Run remote e2e tests: `yarn run e2e:remote --grep=some.spec*`
- Run local e2e tests: `yarn run e2e:local` (requires Docker, jq, and Maven)

### Screenshot Testing
- Screenshot tests are in files ending with `*.screenshot.spec.js`
- DOM-based tests use `*.spec.js` extension
- **Best Practices**:
  - Only use screenshot tests for components that cannot be accessed via the DOM
  - Keep screenshots as small as possible to minimize false positives
  - Larger screenshots require more updates when unrelated features change
  - Use webdriverio selectors for DOM selection (not jQuery)
  - Use `browser.waitForExist()`, `waitForVisible()`, `waitFor()` to handle async behavior
  - Use `browser.debug()` for interactive test development
- **Important**: Reference screenshots created on host system differ from dockerized setup (e.g., CircleCI) and cannot be used as references
- Failed test screenshots are in `screenshots/diff` and `screenshots/error` folders for debugging

### Code Quality
- Pre-commit hooks automatically format code with Prettier
- CircleCI runs prettier checks on pull requests
- Follow existing patterns in similar files when adding new features

## Important Notes

### API Integration
- API clients are auto-generated from Swagger/OpenAPI specs
- Main API client: `packages/cbioportal-ts-api-client/`
- Update API: `yarn run updateAPI`
- Change API root in development: Edit `my-index.ejs`

### Branch Strategy
- `master`: Production-ready code, bug fixes, features without DB migrations
- `rc`: Release candidate with features requiring DB migrations
- See README for detailed branch information

### External Dependencies
- OncoKB API: `packages/oncokb-ts-api-client/`
- Genome Nexus API: `packages/genome-nexus-ts-api-client/`
- These are external services with their own API clients

### Testing Against Live Instances
- Use `localStorage.setItem("localdev", true)` in browser console at cbioportal.org to test local changes
- **Important**: When testing against HTTPS backends (e.g., cbioportal.org, rc.cbioportal.org), use `yarn run startSSL` instead of `yarn run start` to serve frontend over SSL
- Clear with `localStorage.clear()` when done

## Common Patterns

### MobX Observables
```typescript
@observable someValue: boolean = false;
@observable.ref someObject: SomeType | undefined = undefined;

@computed get derivedValue() {
    return this.someValue ? 'yes' : 'no';
}

@action
updateValue() {
    this.someValue = true;
}
```

### Remote Data Pattern
Use `remoteData` for async operations:
```typescript
public someData = remoteData(async () => {
    return fetch('url').then(d => d.json());
});
```

### Path Aliases
- Use configured path aliases from `tsconfig.json`:
  - `shared/*` → `src/shared/*`
  - `config/*` → `src/config/*`
  - `pages/*` → `src/pages/*`
  - etc.

## Documentation
- Main docs: https://docs.cbioportal.org
- Architecture: https://docs.cbioportal.org/2.1-deployment/architecture-overview
- Contributing guidelines: See `CONTRIBUTING.md` (links to main cBioPortal repo)

## Tips for AI Code Generation

1. **Respect existing patterns**: Look at similar files before creating new ones
2. **Use MobX properly**: Don't mix React state with MobX state
3. **Follow TypeScript strictly**: No `any` types unless absolutely necessary
4. **Test thoroughly**: Write tests for new features
5. **Format with Prettier**: Code should match existing formatting
6. **Check imports**: Use the configured path aliases
7. **Consider performance**: This is a data-heavy visualization app
8. **Maintain accessibility**: Follow WCAG guidelines where applicable
