export default function Header({ title, lang, onLangToggle }) {
  return (
    <header
      style={{
        background: 'var(--teal-800)',
        color: 'var(--white)',
        padding: '16px 20px',
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow)',
      }}
    >
      <h1
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h1>
      <div
        style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 10,
          padding: 4,
        }}
      >
        <button
          type="button"
          onClick={() => lang !== 'en' && onLangToggle()}
          aria-label="Switch to English"
          style={{
            minHeight: 40,
            minWidth: 48,
            padding: '8px 12px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: '0.9rem',
            background: lang === 'en' ? 'var(--white)' : 'transparent',
            color: lang === 'en' ? 'var(--teal-800)' : 'rgba(255,255,255,0.9)',
            transition: 'all 0.2s',
          }}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => lang !== 'ta' && onLangToggle()}
          aria-label="Switch to Tamil"
          style={{
            minHeight: 40,
            minWidth: 48,
            padding: '8px 12px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: '0.9rem',
            background: lang === 'ta' ? 'var(--white)' : 'transparent',
            color: lang === 'ta' ? 'var(--teal-800)' : 'rgba(255,255,255,0.9)',
            transition: 'all 0.2s',
          }}
        >
          தமிழ்
        </button>
      </div>
    </header>
  )
}
