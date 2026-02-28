function toTitleCase(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.trim().charAt(0).toUpperCase()
  }
  if (email && email.trim()) return email.trim().charAt(0).toUpperCase()
  return '?'
}

export default function Header({ title, lang, onLangToggle, user, onLogout }) {
  const displayName = user ? toTitleCase(user.name || user.email) : ''
  const avatarUrl = user?.avatar_url || user?.avatar || user?.profile_image

  return (
    <header
      style={{
        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
        color: 'var(--white)',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(29, 78, 216, 0.35)',
      }}
    >
      {/* Left: Logo + Title - visual anchor for illiterate users */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.75rem', lineHeight: 1 }} aria-hidden="true">
          📒
        </span>
        <span style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)', fontWeight: 700, letterSpacing: '-0.02em' }}>
          {title}
        </span>
      </div>

      {/* Right: Large, icon-first buttons for low-literacy users */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              maxWidth: 120,
              minWidth: 0,
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(255,255,255,0.5)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.3)',
                  color: 'var(--white)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {getInitials(user.name, user.email)}
              </div>
            )}
            <span
              className="header-user-name"
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.95)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={user.name || user.email}
            >
              {displayName}
            </span>
          </div>
        )}
        {onLogout && user && (
          <button
            data-testid="logout"
            type="button"
            onClick={onLogout}
            title={lang === 'ta' ? 'வெளியேறுங்கள்' : 'Logout'}
            aria-label={lang === 'ta' ? 'வெளியேறுங்கள்' : 'Logout'}
            className="header-logout-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minHeight: 44,
              minWidth: 44,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.25)',
              color: 'var(--white)',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: '1.1rem' }} aria-hidden="true">🚪</span>
            <span className="header-logout-text">{lang === 'ta' ? 'வெளியேறுங்கள்' : 'Logout'}</span>
          </button>
        )}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 10,
            padding: 4,
            gap: 2,
          }}
        >
          <button
            type="button"
            onClick={() => lang !== 'en' && onLangToggle()}
            title="English"
            aria-label="English"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 40,
              minWidth: 48,
              padding: '8px 12px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.875rem',
              background: lang === 'en' ? 'var(--white)' : 'transparent',
              color: lang === 'en' ? '#1d4ed8' : 'rgba(255,255,255,0.95)',
            }}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => lang !== 'ta' && onLangToggle()}
            title="தமிழ்"
            aria-label="Tamil"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 40,
              minWidth: 48,
              padding: '8px 12px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.875rem',
              background: lang === 'ta' ? 'var(--white)' : 'transparent',
              color: lang === 'ta' ? '#1d4ed8' : 'rgba(255,255,255,0.95)',
            }}
          >
            தமிழ்
          </button>
        </div>
      </div>
    </header>
  )
}
