import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

import {
  countAdmins,
  createCharm,
  deleteCharm,
  getAdminByUsername,
  getCatalogSnapshot,
  getCharm,
  insertAdmin,
  listCharms,
  seedCatalogFromBundledFile,
  setCasePrice,
  updateCharm,
} from './db.js'

dotenv.config()

const PORT = Number.parseInt(process.env.PORT ?? '4000', 10)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
const JWT_SECRET = process.env.ADMIN_JWT_SECRET
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_DEFAULT_USERNAME ?? 'admin'
const NODE_ENV = process.env.NODE_ENV ?? 'development'
const IS_PRODUCTION = NODE_ENV === 'production'

if (!JWT_SECRET) {
  console.error('ADMIN_JWT_SECRET environment variable is required to start the admin API.')
  process.exit(1)
}

seedCatalogFromBundledFile()

const adminCount = countAdmins()
if (adminCount === 0) {
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD
  if (!defaultPassword) {
    console.error('ADMIN_DEFAULT_PASSWORD must be set to seed the initial admin account.')
    process.exit(1)
  }
  const hash = await bcrypt.hash(defaultPassword, 12)
  insertAdmin(DEFAULT_ADMIN_USERNAME, hash)
  console.log(`Seeded default admin user "${DEFAULT_ADMIN_USERNAME}". Please change the password immediately.`)
}

const app = express()
app.set('trust proxy', 1)

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
)

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: IS_PRODUCTION,
    path: '/',
  }
}

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '4h' })
}

function authenticate(req, res, next) {
  const token = req.cookies?.admin_token
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.admin = decoded
    return next()
  } catch (error) {
    res.clearCookie('admin_token', getCookieOptions())
    return res.status(401).json({ message: 'Authentication expired' })
  }
}

function sanitizeCharmPayload(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const price = Number(body.price)
  const icon = typeof body.icon === 'string' && body.icon.trim() !== '' ? body.icon.trim() : null
  const tagsInput = Array.isArray(body.tags)
    ? body.tags
    : typeof body.tags === 'string'
      ? body.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : []
  if (!name) throw new Error('Name is required')
  if (!Number.isFinite(price) || price <= 0) throw new Error('Price must be greater than zero')
  const tags = tagsInput.map((tag) => tag.trim()).filter(Boolean)
  return { name, price, icon, tags }
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'charm'
}

function deriveCharmId(rawId, fallbackName) {
  if (typeof rawId === 'string' && rawId.trim() !== '') {
    const candidate = slugify(rawId.trim())
    if (!candidate) throw new Error('Charm id must contain alphanumeric characters')
    return { id: candidate, generated: false }
  }
  const base = slugify(fallbackName)
  if (!base) throw new Error('Unable to derive a charm id')
  let candidate = base
  let suffix = 1
  while (getCharm(candidate)) {
    candidate = `${base}-${suffix++}`
  }
  return { id: candidate, generated: true }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.get('/api/catalog', (req, res) => {
  res.json(getCatalogSnapshot())
})

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body ?? {}
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' })
  }
  const admin = getAdminByUsername(username)
  if (!admin) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }
  const valid = await bcrypt.compare(password, admin.password_hash)
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }
  const token = createToken({ sub: admin.id, username: admin.username })
  res.cookie('admin_token', token, { ...getCookieOptions(), maxAge: 1000 * 60 * 60 * 4 })
  return res.json({ username: admin.username })
})

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_token', getCookieOptions())
  return res.status(204).end()
})

app.get('/api/admin/me', authenticate, (req, res) => {
  res.json({ username: req.admin.username })
})

app.get('/api/admin/charms', authenticate, (req, res) => {
  res.json({ charms: listCharms() })
})

app.post('/api/admin/charms', authenticate, (req, res) => {
  try {
    const payload = sanitizeCharmPayload(req.body ?? {})
    const { id, generated } = deriveCharmId(req.body?.id, payload.name)
    if (!generated && getCharm(id)) {
      return res.status(409).json({ message: 'Charm id already exists' })
    }
    const created = createCharm({ ...payload, id })
    return res.status(201).json({ charm: created })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
})

app.put('/api/admin/charms/:id', authenticate, (req, res) => {
  try {
    const id = req.params.id
    const existing = getCharm(id)
    if (!existing) {
      return res.status(404).json({ message: 'Charm not found' })
    }
    const payload = sanitizeCharmPayload(req.body ?? {})
    const updated = updateCharm(id, { ...payload, id })
    return res.json({ charm: updated })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
})

app.delete('/api/admin/charms/:id', authenticate, (req, res) => {
  const id = req.params.id
  const removed = deleteCharm(id)
  if (!removed) {
    return res.status(404).json({ message: 'Charm not found' })
  }
  return res.status(204).end()
})

app.put('/api/admin/catalog/case-price', authenticate, (req, res) => {
  const price = Number(req.body?.casePrice)
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: 'Case price must be a positive number' })
  }
  const next = setCasePrice(price)
  return res.json({ casePrice: next })
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.join(__dirname, '..', 'dist')

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    if (req.path.startsWith('/api/')) return next()
    const indexPath = path.join(distDir, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath)
    } else {
      next()
    }
  })
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Unexpected server error' })
})

app.listen(PORT, () => {
  console.log(`Admin API listening on http://localhost:${PORT}`)
})
