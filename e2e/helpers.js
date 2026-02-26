/**
 * E2E test helpers - wait utilities and common actions
 */
import { until } from 'selenium-webdriver'

export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'
export const IMPLICIT_WAIT_MS = 5000

/**
 * Wait for element to be present and visible
 */
export async function waitForElement(driver, locator, timeout = 10000) {
  return driver.wait(until.elementLocated(locator), timeout)
}

/**
 * Wait for element and ensure it's displayed
 */
export async function waitForVisible(driver, locator, timeout = 10000) {
  const el = await waitForElement(driver, locator, timeout)
  await driver.wait(until.elementIsVisible(el), timeout)
  return el
}

/**
 * Wait for element to be clickable
 */
export async function waitForClickable(driver, locator, timeout = 10000) {
  const el = await waitForVisible(driver, locator, timeout)
  await driver.wait(until.elementIsEnabled(el), timeout)
  return el
}

/**
 * Generate unique email for test signups
 */
export function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`
}
