import { useState, useEffect, useRef } from 'react'
import * as api from '../lib/api'

const ORANGE = '#ea580c'
const ORANGE_LIGHT = '#fff7ed'
const RED = '#dc2626'
const RED_LIGHT = '#fef2f2'

const t = {
  welcome: { en: 'Welcome', ta: 'வரவேற்கிறோம்' },
  slogan: { en: 'Ledger Book: Simplify your kirana shop P&L', ta: 'கணக்கு புத்தகம்: உங்கள் கடை இலாப நட்டத்தை எளிதாக்குகிறது' },
  login: { en: 'Login', ta: 'உள்நுழை' },
  signup: { en: 'Sign up', ta: 'பதிவு செய்' },
  signInToContinue: { en: 'Sign in to your account', ta: 'உங்கள் கணக்கில் உள்நுழையுங்கள்' },
  createAccount: { en: 'We need a few details to create your account', ta: 'கணக்கு உருவாக்க தேவையான விவரங்கள்' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  password: { en: 'Password', ta: 'கடவுச்சொல்' },
  name: { en: 'Name', ta: 'பெயர்' },
  back: { en: 'Back', ta: 'பின்செல்' },
  switchToSignup: { en: "Don't have an account? Sign up", ta: 'கணக்கு இல்லையா? பதிவு செய்யுங்கள்' },
  switchToLogin: { en: 'Already have an account? Login', ta: 'கணக்கு உள்ளதா? உள்நுழையுங்கள்' },
  forgotPassword: { en: 'Forgot password?', ta: 'கடவுச்சொல் மறந்தீர்களா?' },
  forgotTitle: { en: 'Reset password', ta: 'கடவுச்சொல் மீட்டமை' },
  forgotSubtitle: { en: 'Enter your email to get a reset link', ta: 'மீட்டமை இணைப்பு பெற மின்னஞ்சலை உள்ளிடுக' },
  checkEmail: { en: 'Check your email for the reset link', ta: 'மீட்டமை இணைப்பிற்கு மின்னஞ்சலை சரிபார்க்கவும்' },
  resetTitle: { en: 'Set new password', ta: 'புதிய கடவுச்சொல்லை அமைக்கவும்' },
  newPassword: { en: 'New password', ta: 'புதிய கடவுச்சொல்' },
  confirmPassword: { en: 'Confirm password', ta: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்' },
  resetSuccess: { en: 'Password updated! You can now login.', ta: 'கடவுச்சொல் மேம்படுத்தப்பட்டது! இப்போது உள்நுழையலாம்.' },
}

export default function AuthScreen({ mode: initialMode, lang = 'en', onLangToggle, onLogin, onSignup }) {
  const [view, setView] = useState(initialMode === 'signup' ? 'signup' : initialMode === 'login' ? 'login' : 'welcome')
  const [resetToken, setResetToken] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const forgotEmailRef = useRef(null)
  const resetPasswordRef = useRef(null)
  const resetConfirmRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('resetToken')
    if (token) {
      setResetToken(token)
      setView('reset')
      window.history.replaceState({}, '', window.location.pathname || '/')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (view === 'login') {
        await onLogin(email, password)
      } else if (view === 'signup') {
        await onSignup(email, password, name)
      } else if (view === 'forgot') {
        const data = await api.forgotPassword(email)
        setSuccess(data.message)
        if (data.resetToken) {
          setResetToken(data.resetToken)
        }
      } else if (view === 'reset' && resetToken) {
        if (password !== confirmPassword) {
          setError(lang === 'en' ? 'Passwords do not match' : 'கடவுச்சொற்கள் பொருந்தாது')
          setLoading(false)
          return
        }
        await api.resetPassword(resetToken, password)
        setResetToken(null)
        setView('login')
        setPassword('')
        setConfirmPassword('')
        setSuccess(tBoth('resetSuccess'))
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const tBoth = (key) => t[key]?.[lang] || t[key]?.en || key

  // Welcome / Landing
  if (view === 'welcome') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'var(--white)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Language toggle - top right */}
        {onLangToggle && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              display: 'flex',
              gap: 4,
              background: 'var(--gray-100)',
              borderRadius: 10,
              padding: 4,
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onClick={() => lang !== 'en' && onLangToggle()}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.8rem',
                background: lang === 'en' ? 'var(--white)' : 'transparent',
                color: lang === 'en' ? 'var(--slate-900)' : 'var(--text-secondary)',
                boxShadow: lang === 'en' ? 'var(--shadow-sm)' : 'none',
                border: lang === 'en' ? '1px solid var(--gray-200)' : '1px solid transparent',
              }}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => lang !== 'ta' && onLangToggle()}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.8rem',
                background: lang === 'ta' ? 'var(--white)' : 'transparent',
                color: lang === 'ta' ? 'var(--slate-900)' : 'var(--text-secondary)',
                boxShadow: lang === 'ta' ? 'var(--shadow-sm)' : 'none',
                border: lang === 'ta' ? '1px solid var(--gray-200)' : '1px solid transparent',
              }}
            >
              தமிழ்
            </button>
          </div>
        )}

        {/* Decorative shape - top left */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            left: -40,
            width: 180,
            height: 180,
            borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
            background: `linear-gradient(135deg, ${ORANGE} 0%, ${RED} 100%)`,
            opacity: 0.15,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `linear-gradient(180deg, ${ORANGE} 0%, ${RED} 100%)`,
            opacity: 0.08,
          }}
        />

        {/* Logo + Brand */}
        <div style={{ textAlign: 'center', marginBottom: 16, position: 'relative' }}>
          <div
            style={{
              fontSize: '3rem',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span style={{ filter: 'drop-shadow(0 2px 4px rgba(220,38,38,0.2))' }}>📒</span>
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: RED,
              marginBottom: 4,
            }}
          >
            Ledger Book
          </h1>
        </div>

        <h2
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--slate-900)',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          {tBoth('welcome')}
        </h2>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            marginBottom: 48,
            maxWidth: 300,
          }}
        >
          {tBoth('slogan')}
        </p>

        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            data-testid="auth-login-btn"
            type="button"
            onClick={() => setView('login')}
            style={{
              width: '100%',
              padding: 16,
              background: ORANGE,
              color: 'var(--white)',
              borderRadius: 14,
              fontWeight: 600,
              fontSize: '1rem',
              boxShadow: `0 4px 14px ${ORANGE}40`,
            }}
          >
            {tBoth('login')}
          </button>
          <button
            data-testid="auth-signup-btn"
            type="button"
            onClick={() => setView('signup')}
            style={{
              width: '100%',
              padding: 16,
              background: RED,
              color: 'var(--white)',
              borderRadius: 14,
              fontWeight: 600,
              fontSize: '1rem',
              boxShadow: `0 4px 14px ${RED}40`,
            }}
          >
            {tBoth('signup')}
          </button>
        </div>
      </div>
    )
  }

  // Shared card wrapper for forgot/reset (matches login theme)
  const AuthCard = ({ children }) => (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(180deg, #fafafa 0%, #fff5f5 40%, #fff7ed 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative shapes - pointer-events: none so they don't block input clicks */}
      <div
        style={{
          position: 'absolute',
          top: -80,
          left: -60,
          width: 200,
          height: 200,
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
          background: `linear-gradient(135deg, ${ORANGE} 0%, ${RED} 100%)`,
          opacity: 0.12,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -40,
          right: -50,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: `linear-gradient(180deg, ${RED} 0%, ${ORANGE} 100%)`,
          opacity: 0.08,
          pointerEvents: 'none',
        }}
      />
      {children}
    </div>
  )

  // Forgot password view - use plain background (no decorative overlays that can block input on some devices)
  if (view === 'forgot') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'var(--gray-50)',
        }}
      >
        {onLangToggle && (
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 4, background: 'var(--white)', borderRadius: 10, padding: 4, zIndex: 10, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
            <button type="button" onClick={() => lang !== 'en' && onLangToggle()} style={{ padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', background: lang === 'en' ? 'var(--gray-100)' : 'transparent', color: lang === 'en' ? 'var(--slate-900)' : 'var(--text-secondary)', border: 'none' }}>EN</button>
            <button type="button" onClick={() => lang !== 'ta' && onLangToggle()} style={{ padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', background: lang === 'ta' ? 'var(--gray-100)' : 'transparent', color: lang === 'ta' ? 'var(--slate-900)' : 'var(--text-secondary)', border: 'none' }}>தமிழ்</button>
          </div>
        )}
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            background: 'var(--white)',
            borderRadius: 'var(--radius-xl)',
            padding: 40,
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--gray-200)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 2px 4px rgba(220,38,38,0.2))' }}>🔐</span>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: RED, marginTop: 8, marginBottom: 4 }}>{tBoth('forgotTitle')}</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{tBoth('forgotSubtitle')}</p>
          </div>
          <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); }} style={{ position: 'absolute', top: 16, left: 20, padding: '6px 0', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>← {tBoth('back')}</button>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ padding: 16, background: '#ecfdf5', borderRadius: 12, marginBottom: 20, border: '1px solid #a7f3d0' }}>
                <p style={{ color: 'var(--green-700)', fontSize: '0.9rem', marginBottom: resetToken ? 12 : 0 }}>{success}</p>
                {resetToken && (
                  <p style={{ color: 'var(--green-700)', fontSize: '0.85rem', marginTop: 8, marginBottom: 0 }}>
                    {lang === 'en' ? 'Click the button below to set a new password.' : 'புதிய கடவுச்சொல்லை அமைக்க கீழே உள்ள பொத்தானை அழுத்துங்கள்.'}
                  </p>
                )}
              </div>
              {resetToken ? (
                <a
                  href={`${window.location.origin}${window.location.pathname || '/'}?resetToken=${resetToken}`}
                  style={{
                    display: 'inline-block',
                    padding: '14px 28px',
                    background: `linear-gradient(135deg, ${ORANGE} 0%, ${RED} 100%)`,
                    color: 'white',
                    borderRadius: 14,
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    textDecoration: 'none',
                    boxShadow: `0 4px 14px ${RED}40`,
                  }}
                >
                  {lang === 'en' ? 'Set new password' : 'புதிய கடவுச்சொல்லை அமைக்கவும்'}
                </a>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                  {lang === 'en' ? "If you don't see an email, check spam or try signing up." : 'மின்னஞ்சல் இல்லையா? ஸ்பாம் சரிபார்க்கவும்.'}
                </p>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const emailToUse = forgotEmailRef.current?.value?.trim() || email
                if (!emailToUse) {
                  setError(lang === 'en' ? 'Email required' : 'மின்னஞ்சல் தேவை')
                  return
                }
                setError('')
                setLoading(true)
                api.forgotPassword(emailToUse).then((data) => {
                  setSuccess(data.message)
                  if (data.resetToken) setResetToken(data.resetToken)
                }).catch((err) => setError(err.message)).finally(() => setLoading(false))
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="forgot-email" style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-700)' }}>{tBoth('email')} *</label>
                <input
                  ref={forgotEmailRef}
                  id="forgot-email"
                  name="email"
                  data-testid="auth-email"
                  type="email"
                  defaultValue=""
                  autoComplete="email"
                  inputMode="email"
                  required
                  style={{
                    border: '2px solid var(--gray-200)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    width: '100%',
                    fontSize: 16,
                    boxSizing: 'border-box',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                />
              </div>
              {error && <div style={{ marginBottom: 20, padding: 14, background: RED_LIGHT, color: 'var(--red-700)', borderRadius: 12, fontSize: '0.875rem', border: '1px solid #fecaca' }}>{error}</div>}
              <button data-testid="auth-submit" type="submit" disabled={loading} style={{ width: '100%', padding: 16, background: `linear-gradient(135deg, ${ORANGE} 0%, ${RED} 100%)`, color: 'var(--white)', borderRadius: 14, fontWeight: 600, fontSize: '1rem', boxShadow: `0 4px 14px ${RED}40`, border: 'none' }}>{loading ? '…' : (lang === 'en' ? 'Send reset link' : 'மீட்டமை இணைப்பை அனுப்பு')}</button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Reset password view (from email link) - plain layout, uncontrolled inputs
  if (view === 'reset' && resetToken) {
    const inputStyle = {
      border: '2px solid var(--gray-200)',
      borderRadius: 12,
      padding: '14px 16px',
      width: '100%',
      fontSize: 16,
      boxSizing: 'border-box',
      WebkitAppearance: 'none',
      appearance: 'none',
    }
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'var(--gray-50)',
        }}
      >
        {onLangToggle && (
          <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 4, background: 'var(--white)', borderRadius: 10, padding: 4, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', zIndex: 10 }}>
            <button type="button" onClick={() => lang !== 'en' && onLangToggle()} style={{ padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', background: lang === 'en' ? 'var(--gray-100)' : 'transparent', color: lang === 'en' ? 'var(--slate-900)' : 'var(--text-secondary)', border: 'none' }}>EN</button>
            <button type="button" onClick={() => lang !== 'ta' && onLangToggle()} style={{ padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', background: lang === 'ta' ? 'var(--gray-100)' : 'transparent', color: lang === 'ta' ? 'var(--slate-900)' : 'var(--text-secondary)', border: 'none' }}>தமிழ்</button>
          </div>
        )}
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            background: 'var(--white)',
            borderRadius: 'var(--radius-xl)',
            padding: 40,
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--gray-200)',
            position: 'relative',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 2px 4px rgba(234,88,12,0.2))' }}>🔑</span>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: RED, marginTop: 8, marginBottom: 4 }}>{tBoth('resetTitle')}</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{lang === 'en' ? 'Choose a strong password (min 6 characters)' : 'வலுவான கடவுச்சொல்லை தேர்ந்தெடுக்கவும் (குறைந்தது 6 எழுத்துகள்)'}</p>
          </div>
          <button type="button" onClick={() => { setView('login'); setResetToken(null); setError(''); setSuccess(''); }} style={{ marginBottom: 24, padding: '8px 0', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>← {tBoth('back')}</button>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const pwd = resetPasswordRef.current?.value || ''
              const confirm = resetConfirmRef.current?.value || ''
              if (pwd !== confirm) {
                setError(lang === 'en' ? 'Passwords do not match' : 'கடவுச்சொற்கள் பொருந்தாது')
                return
              }
              if (pwd.length < 6) {
                setError(lang === 'en' ? 'Password must be at least 6 characters' : 'குறைந்தது 6 எழுத்துகள் தேவை')
                return
              }
              setError('')
              setSuccess('')
              setLoading(true)
              try {
                await api.resetPassword(resetToken, pwd)
                setResetToken(null)
                setView('login')
                setSuccess(tBoth('resetSuccess'))
              } catch (err) {
                setError(err.message || 'Something went wrong')
              } finally {
                setLoading(false)
              }
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="reset-password" style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-700)' }}>{tBoth('newPassword')} *</label>
              <input
                ref={resetPasswordRef}
                id="reset-password"
                name="new-password"
                data-testid="auth-password"
                type="password"
                defaultValue=""
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="••••••"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label htmlFor="reset-confirm" style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-700)' }}>{tBoth('confirmPassword')} *</label>
              <input
                ref={resetConfirmRef}
                id="reset-confirm"
                name="confirm-password"
                type="password"
                defaultValue=""
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="••••••"
                style={inputStyle}
              />
            </div>
            {success && <div style={{ marginBottom: 20, padding: 14, background: '#ecfdf5', color: 'var(--green-700)', borderRadius: 12, fontSize: '0.875rem', border: '1px solid #a7f3d0' }}>{success}</div>}
            {error && <div style={{ marginBottom: 20, padding: 14, background: RED_LIGHT, color: 'var(--red-700)', borderRadius: 12, fontSize: '0.875rem', border: '1px solid #fecaca' }}>{error}</div>}
            <button data-testid="auth-submit" type="submit" disabled={loading} style={{ width: '100%', padding: 16, background: `linear-gradient(135deg, ${ORANGE} 0%, ${RED} 100%)`, color: 'var(--white)', borderRadius: 14, fontWeight: 600, fontSize: '1rem', boxShadow: `0 4px 14px ${RED}40`, border: 'none' }}>{loading ? '…' : (lang === 'en' ? 'Reset password' : 'கடவுச்சொல் மீட்டமை')}</button>
          </form>
        </div>
      </div>
    )
  }

  // Login or Signup Form - simple layout without overlays to ensure inputs work
  const isSignup = view === 'signup'
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--gray-50)',
      }}
    >
      {onLangToggle && (
        <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 4, background: 'var(--white)', borderRadius: 10, padding: 4, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', zIndex: 100 }}>
          <button type="button" onClick={() => lang !== 'en' && onLangToggle()} style={{ padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', background: lang === 'en' ? 'var(--gray-100)' : 'transparent', color: lang === 'en' ? 'var(--slate-900)' : 'var(--text-secondary)', border: 'none' }}>EN</button>
          <button type="button" onClick={() => lang !== 'ta' && onLangToggle()} style={{ padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', background: lang === 'ta' ? 'var(--gray-100)' : 'transparent', color: lang === 'ta' ? 'var(--slate-900)' : 'var(--text-secondary)', border: 'none' }}>தமிழ்</button>
        </div>
      )}
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--white)',
          borderRadius: 'var(--radius-xl)',
          padding: 40,
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--gray-200)',
          position: 'relative',
        }}
      >
        <button type="button" onClick={() => { setView('welcome'); setError(''); setSuccess(''); }} style={{ marginBottom: 24, padding: '8px 0', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>← {tBoth('back')}</button>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 2px 4px rgba(220,38,38,0.2))' }}>{isSignup ? '📝' : '🔓'}</span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: RED, marginTop: 8, marginBottom: 4 }}>{isSignup ? tBoth('signup') : tBoth('login')}</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{isSignup ? tBoth('createAccount') : tBoth('signInToContinue')}</p>
        </div>

      {success && (
        <div style={{ marginBottom: 20, padding: 14, background: '#ecfdf5', color: 'var(--green-700)', borderRadius: 12, fontSize: '0.875rem', border: '1px solid #a7f3d0' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {isSignup && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-700)' }}>
              {tBoth('name')} *
            </label>
            <input
              data-testid="auth-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              style={{
                border: '1px solid var(--gray-200)',
                borderRadius: 12,
                padding: '14px 16px',
                width: '100%',
              }}
            />
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-700)' }}>
            {tBoth('email')} *
          </label>
          <input
            data-testid="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            style={{
              border: '1px solid var(--gray-200)',
              borderRadius: 12,
              padding: '14px 16px',
              width: '100%',
            }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-700)' }}>
            {tBoth('password')} *
          </label>
          <input
            data-testid="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onInput={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            minLength={isSignup ? 6 : undefined}
            readOnly={false}
            aria-label="Password"
            style={{
              border: '1px solid var(--gray-200)',
              borderRadius: 12,
              padding: '14px 16px',
              width: '100%',
              WebkitAppearance: 'none',
              appearance: 'none',
            }}
          />
          {!isSignup && (
            <button
              type="button"
              onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
              style={{
                marginTop: 12,
                padding: 0,
                background: 'none',
                color: ORANGE,
                fontSize: '0.8125rem',
                fontWeight: 500,
                display: 'block',
              }}
            >
              {tBoth('forgotPassword')}
            </button>
          )}
        </div>
        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: 14,
              background: RED_LIGHT,
              color: 'var(--red-700)',
              borderRadius: 12,
              fontSize: '0.875rem',
              border: '1px solid #fecaca',
            }}
          >
            {error}
          </div>
        )}
        <button
          data-testid="auth-submit"
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 16,
            background: `linear-gradient(135deg, ${isSignup ? RED : ORANGE} 0%, ${isSignup ? '#b91c1c' : RED} 100%)`,
            color: 'var(--white)',
            borderRadius: 14,
            fontWeight: 600,
            fontSize: '1rem',
            boxShadow: `0 4px 14px ${RED}40`,
            border: 'none',
          }}
        >
          {loading ? '…' : isSignup ? tBoth('signup') : tBoth('login')}
        </button>
      </form>

      <button
        data-testid="auth-switch-mode"
        type="button"
        onClick={() => {
          setView(isSignup ? 'login' : 'signup')
          setError('')
          setSuccess('')
        }}
        style={{
          width: '100%',
          marginTop: 24,
          padding: 14,
          background: 'transparent',
          color: 'var(--slate-600)',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        {isSignup ? tBoth('switchToLogin') : tBoth('switchToSignup')}
      </button>
      </div>
    </div>
  )
}
