/**
 * PWA update helpers - check for new app version
 */
let swRegistration = null

export function setSWRegistration(reg) {
  swRegistration = reg
}

export function checkForUpdates() {
  if (swRegistration) swRegistration.update()
}

export function initVisibilityCheck() {
  if (typeof document === 'undefined') return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates()
    }
  })
}
