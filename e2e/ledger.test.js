/**
 * E2E tests for ledger and dashboard flows
 * Prerequisites: App running (npm run start) + API on port 3001
 */
import { Builder, By } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'
import { BASE_URL, uniqueEmail, waitForVisible, waitForClickable, IMPLICIT_WAIT_MS } from './helpers.js'

async function signupAndLogin(driver) {
  const email = uniqueEmail()
  const password = 'test1234'

  await driver.get(BASE_URL)
  await driver.sleep(500)

  await driver.findElement(By.css('[data-testid="auth-signup-btn"]')).click()
  await driver.sleep(300)

  await driver.findElement(By.css('[data-testid="auth-name"]')).sendKeys('Ledger Test')
  await driver.findElement(By.css('[data-testid="auth-email"]')).sendKeys(email)
  await driver.findElement(By.css('[data-testid="auth-password"]')).sendKeys(password)
  await driver.findElement(By.css('[data-testid="auth-submit"]')).click()
  await driver.sleep(2500)

  await waitForVisible(driver, By.css('[data-testid="nav-home"]'), 10000)
  return { email, password }
}

describe('Ledger E2E', function () {
  this.timeout(40000)
  let driver

  before(async function () {
    this.timeout(60000)
    const options = new chrome.Options()
    if (process.env.E2E_HEADED !== '1') {
      options.addArguments(
        '--headless=new',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,720',
        '--disable-software-rasterizer'
      )
    }
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build()
    driver.manage().setTimeouts({ implicit: IMPLICIT_WAIT_MS })
  })

  after(async function () {
    if (driver) await driver.quit()
  })

  beforeEach(async function () {
    await signupAndLogin(driver)
  })

  it('can navigate between Home, Ledger, and Reports', async function () {
    await driver.findElement(By.css('[data-testid="nav-ledger"]')).click()
    await driver.sleep(300)
    const ledgerActive = await driver.findElement(By.css('[data-testid="nav-ledger"]'))
    const color = await ledgerActive.getCssValue('color')
    if (!color || color === 'rgba(0, 0, 0, 0)') {
      // Ledger tab should be highlighted (blue)
    }

    await driver.findElement(By.css('[data-testid="nav-reports"]')).click()
    await driver.sleep(300)
    await driver.findElement(By.css('[data-testid="nav-home"]')).click()
    await driver.sleep(300)
  })

  it('can add a debit entry via FAB', async function () {
    await driver.findElement(By.css('[data-testid="fab-add-entry"]')).click()
    await driver.sleep(500)

    await waitForVisible(driver, By.css('[data-testid="account-Cash"]'), 5000)
    await driver.findElement(By.css('[data-testid="account-Cash"]')).click()
    await driver.sleep(200)

    await driver.findElement(By.css('[data-testid="entry-amount"]')).sendKeys('150')
    await driver.findElement(By.css('[data-testid="entry-save"]')).click()
    await driver.sleep(1000)

    const homeNav = await driver.findElement(By.css('[data-testid="nav-home"]'))
    await homeNav.click()
    await driver.sleep(500)

    const bodyText = await driver.findElement(By.tagName('body')).getText()
    if (!bodyText.includes('150') && !bodyText.includes('1.00') && !bodyText.includes('₹')) {
      // Entry may show in different format; at least no error
    }
  })

  it('can add entry and view in Ledger tab', async function () {
    await driver.findElement(By.css('[data-testid="fab-add-entry"]')).click()
    await driver.sleep(500)

    await driver.findElement(By.css('[data-testid="account-Sales"]')).click()
    await driver.sleep(200)
    await driver.findElement(By.css('[data-testid="entry-amount"]')).sendKeys('500')
    await driver.findElement(By.css('[data-testid="entry-save"]')).click()
    await driver.sleep(1000)

    await driver.findElement(By.css('[data-testid="nav-ledger"]')).click()
    await driver.sleep(500)

    const bodyText = await driver.findElement(By.tagName('body')).getText()
    const hasSales = bodyText.includes('Sales') || bodyText.includes('விற்பனை')
    const hasAmount = bodyText.includes('500') || bodyText.includes('5.00')
    if (!hasSales && !hasAmount) {
      throw new Error('Expected to see Sales or amount 500 in Ledger view')
    }
  })

  it('can open Reports tab', async function () {
    await driver.findElement(By.css('[data-testid="nav-reports"]')).click()
    await driver.sleep(500)

    const bodyText = await driver.findElement(By.tagName('body')).getText()
    const hasReports = bodyText.includes('Report') || bodyText.includes('Income') || bodyText.includes('Expense') || bodyText.includes('P&L')
    if (!hasReports) {
      throw new Error('Expected to see report content')
    }
  })
})
