/**
 * Local API server - connects to your Postgres and serves ledger data.
 * Run: npm run server
 */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

import { swaggerSpec } from './swagger.js'

const { Pool } = pg
const APP_URL = process.env.APP_URL || 'http://localhost:5173'
const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'ledger-book-secret-change-in-production'

function getDbConfig() {
  const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ledger_book'
  try {
    const u = new URL(url)
    return {
      host: u.hostname || 'localhost',
      port: u.port || 5432,
      database: (u.pathname || '/').slice(1) || 'ledger_book',
      user: u.username || 'postgres',
      password: typeof u.password === 'string' ? u.password : '',
    }
  } catch {
    return { host: 'localhost', port: 5432, database: 'ledger_book', user: 'postgres', password: 'postgres' }
  }
}

const pool = new Pool(getDbConfig())

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

app.use('/api-docs', swaggerUi.serve)
app.get('/api-docs', swaggerUi.setup(swaggerSpec))

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Login required' })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {}
    const emailTrim = (email || '').trim().toLowerCase()
    const passwordStr = String(password || '')
    const nameTrim = (name || '').trim() || emailTrim.split('@')[0]

    if (!emailTrim || passwordStr.length < 6) {
      return res.status(400).json({ error: 'Email required and password must be at least 6 characters' })
    }

    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [emailTrim])
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    const hash = await bcrypt.hash(passwordStr, 10)
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, avatar_url, created_at',
      [emailTrim, hash, nameTrim]
    )
    const user = rows[0]
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    const emailTrim = (email || '').trim().toLowerCase()
    const passwordStr = String(password || '')

    if (!emailTrim || !passwordStr) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const { rows } = await pool.query(
      'SELECT id, email, name, password_hash, avatar_url FROM users WHERE email = $1',
      [emailTrim]
    )
    const user = rows[0]
    if (!user || !(await bcrypt.compare(passwordStr, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Forgot password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {}
    const emailTrim = (email || '').trim().toLowerCase()
    if (!emailTrim) {
      return res.status(400).json({ error: 'Email required' })
    }

    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [emailTrim])
    if (rows.length === 0) {
      return res.json({ ok: true, message: 'If an account exists, you will receive a reset link' })
    }

    const userId = rows[0].id
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
      [userId, token, expiresAt]
    )

    const resetLink = `${APP_URL}/?resetToken=${token}`

    const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER
    if (hasSmtp) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: emailTrim,
        subject: 'Reset your Ledger Book password',
        text: `Click this link to reset your password (valid for 1 hour):\n${resetLink}`,
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password. Link expires in 1 hour.</p>`,
      })
    } else {
      console.log('[Password reset] No SMTP configured. Reset link:', resetLink)
    }

    res.json({
      ok: true,
      message: hasSmtp ? 'If an account exists, check your email for a reset link' : 'Check server console for reset link (SMTP not configured)',
      ...(hasSmtp ? {} : { resetToken: token }),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Reset password (with token from email link)
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {}
    const tokenStr = (token || '').trim()
    const passwordStr = String(newPassword || '')
    if (!tokenStr || passwordStr.length < 6) {
      return res.status(400).json({ error: 'Token and password (min 6 characters) required' })
    }

    const { rows } = await pool.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > now()',
      [tokenStr]
    )
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Request a new one.' })
    }

    const userId = rows[0].user_id
    const hash = await bcrypt.hash(passwordStr, 10)
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId])
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId])

    res.json({ ok: true, message: 'Password updated. You can now login.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1',
      [req.userId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'User not found' })
    res.json({ user: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { name, avatar_url } = req.body || {}
    const updates = []
    const values = []
    let i = 1
    if (name !== undefined) {
      updates.push(`name = $${i}`)
      values.push(String(name || '').trim() || null)
      i++
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${i}`)
      values.push(typeof avatar_url === 'string' && avatar_url.trim() ? avatar_url.trim() : null)
      i++
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' })
    values.push(req.userId)
    const { rows } = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, email, name, avatar_url, created_at`,
      values
    )
    if (!rows[0]) return res.status(404).json({ error: 'User not found' })
    res.json({ user: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Ledger routes (require auth)
app.get('/api/ledger', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT accounts, entries FROM ledger_data WHERE user_id = $1',
      [req.userId]
    )
    const row = rows[0]
    if (!row) {
      return res.json({ accounts: [], entries: [] })
    }
    res.json({
      accounts: row.accounts || [],
      entries: row.entries || [],
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/ledger', authMiddleware, async (req, res) => {
  try {
    const { accounts = [], entries = [] } = req.body || {}
    await pool.query(
      `INSERT INTO ledger_data (user_id, accounts, entries)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET accounts = $2, entries = $3, updated_at = now()`,
      [req.userId, JSON.stringify(accounts), JSON.stringify(entries)]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL DEFAULT '',
        avatar_url VARCHAR(512),
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512)`).catch(() => {})

    const { rows } = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ledger_data' AND column_name = 'device_id'
    `)
    if (rows.length > 0) {
      await pool.query('DROP TABLE IF EXISTS ledger_data CASCADE')
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ledger_data (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        accounts JSONB NOT NULL DEFAULT '[]',
        entries JSONB NOT NULL DEFAULT '[]',
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(64) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      )
    `)
    console.log('DB ready')
  } catch (err) {
    console.error('DB init failed:', err.message)
    process.exit(1)
  }
}

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Ledger API: http://localhost:${PORT}`)
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`)
  })
})
