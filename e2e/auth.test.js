/**
 * E2E tests for authentication (signup, login)
 * Prerequisites: App running (npm run start) + API on port 3001
 */
import { Builder, By } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'
import { BASE_URL, uniqueEmail, waitForVisible, waitForClickable, IMPLICIT_WAIT_MS } from './helpers.js'

describe('Auth E2E', function () {
  this.timeout(30000)
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
    await driver.get(BASE_URL)
  })

  it('shows welcome screen then login form', async function () {
    const loginBtn = await waitForVisible(driver, By.css('[data-testid="auth-login-btn"]'))
    await loginBtn.click()
    await driver.sleep(300)

    const emailInput = await waitForVisible(driver, By.css('[data-testid="auth-email"]'))
    const passwordInput = await driver.findElement(By.css('[data-testid="auth-password"]'))
    const submitBtn = await driver.findElement(By.css('[data-testid="auth-submit"]'))

    await emailInput.sendKeys('test@example.com')
    await passwordInput.sendKeys('password123')
    const emailVal = await emailInput.getAttribute('value')
    const pwdVal = await passwordInput.getAttribute('value')
    if (emailVal !== 'test@example.com' || pwdVal !== 'password123') {
      throw new Error('Form did not accept input')
    }
  })

  it('can switch to signup mode', async function () {
    await driver.findElement(By.css('[data-testid="auth-login-btn"]')).click()
    await driver.sleep(300)

    const switchBtn = await waitForClickable(driver, By.css('[data-testid="auth-switch-mode"]'))
    await switchBtn.click()

    const nameInput = await driver.findElement(By.css('[data-testid="auth-name"]'))
    const submitBtn = await driver.findElement(By.css('[data-testid="auth-submit"]'))
    const submitText = await submitBtn.getText()
    const isSignup = submitText.toLowerCase().includes('sign') || submitText.includes('பதிவு')
    if (!isSignup) throw new Error('Expected signup mode but got: ' + submitText)
  })

  it('can sign up and land on dashboard', async function () {
    await driver.findElement(By.css('[data-testid="auth-signup-btn"]')).click()
    await driver.sleep(300)

    const email = uniqueEmail()
    const name = 'E2E Test User'
    const password = 'test1234'

    await driver.findElement(By.css('[data-testid="auth-name"]')).sendKeys(name)
    await driver.findElement(By.css('[data-testid="auth-email"]')).sendKeys(email)
    await driver.findElement(By.css('[data-testid="auth-password"]')).sendKeys(password)
    await driver.findElement(By.css('[data-testid="auth-submit"]')).click()

    await driver.sleep(2000)

    const homeNav = await waitForVisible(driver, By.css('[data-testid="nav-home"]'), 15000)
    const navText = await homeNav.getText()
    if (!navText.toLowerCase().includes('home')) {
      throw new Error('Expected to see Home nav after signup, got: ' + navText)
    }
  })

  it('can logout and login again', async function () {
    const email = uniqueEmail()
    const password = 'test1234'

    await driver.findElement(By.css('[data-testid="auth-signup-btn"]')).click()
    await driver.sleep(300)

    await driver.findElement(By.css('[data-testid="auth-name"]')).sendKeys('Login Test')
    await driver.findElement(By.css('[data-testid="auth-email"]')).sendKeys(email)
    await driver.findElement(By.css('[data-testid="auth-password"]')).sendKeys(password)
    await driver.findElement(By.css('[data-testid="auth-submit"]')).click()
    await driver.sleep(2000)

    await waitForVisible(driver, By.css('[data-testid="logout"]'), 10000)
    await driver.findElement(By.css('[data-testid="logout"]')).click()
    await driver.sleep(500)

    await driver.findElement(By.css('[data-testid="auth-login-btn"]')).click()
    await driver.sleep(300)
    await driver.findElement(By.css('[data-testid="auth-email"]')).sendKeys(email)
    await driver.findElement(By.css('[data-testid="auth-password"]')).sendKeys(password)
    await driver.findElement(By.css('[data-testid="auth-submit"]')).click()
    await driver.sleep(2000)

    const homeNav = await waitForVisible(driver, By.css('[data-testid="nav-home"]'), 10000)
    const navText = await homeNav.getText()
    if (!navText.toLowerCase().includes('home')) {
      throw new Error('Expected to see Home nav after login, got: ' + navText)
    }
  })
})
