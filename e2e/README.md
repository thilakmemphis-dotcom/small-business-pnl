# E2E Tests (Selenium)

End-to-end browser tests using Selenium WebDriver and Mocha.

## Prerequisites

- **Chrome** browser installed
- **App + API running**:
  ```bash
  npm run start
  ```
  This starts the API on port 3001 and the Vite dev server on 5173.

## Run Tests

```bash
npm run test:e2e
```

Tests run in headless Chrome by default. Use `E2E_HEADED=1` to run with a visible browser.

## Troubleshooting

- **"before all" hook timeout**: Ensure Chrome is installed. On first run, Selenium may download chromedriver (can take ~1 min). Try `E2E_HEADED=1` if headless fails.
- **Connection refused**: Start the app first with `npm run start` before running tests.

## Test Coverage

- **auth.test.js**: Login form, signup, logout, login again
- **ledger.test.js**: Navigation (Home, Ledger, Reports), add entry, view reports

## Customize

- `E2E_BASE_URL`: Override app URL (default: `http://localhost:5173`)
- Tests use `data-testid` attributes for stable element selection
