import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
fs.mkdirSync(dataDir, { recursive: true })

const dbPath = path.join(dataDir, 'zhunkbox.sqlite')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS charms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    icon TEXT,
    tags TEXT DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

function parseTags(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function listCharms() {
  const rows = db.prepare('SELECT id, name, price, icon, tags FROM charms ORDER BY name ASC').all()
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    price: Number(row.price),
    icon: row.icon ?? undefined,
    tags: parseTags(row.tags),
  }))
}

export function getCharm(id) {
  const row = db.prepare('SELECT id, name, price, icon, tags FROM charms WHERE id = ?').get(id)
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    icon: row.icon ?? undefined,
    tags: parseTags(row.tags),
  }
}

export function createCharm(charm) {
  db.prepare(
    `INSERT INTO charms (id, name, price, icon, tags, updated_at)
     VALUES (@id, @name, @price, @icon, @tags, CURRENT_TIMESTAMP)`,
  ).run({
    id: charm.id,
    name: charm.name,
    price: charm.price,
    icon: charm.icon ?? null,
    tags: JSON.stringify(charm.tags ?? []),
  })
  return getCharm(charm.id)
}

export function updateCharm(id, charm) {
  db.prepare(
    `UPDATE charms
     SET name = @name,
         price = @price,
         icon = @icon,
         tags = @tags,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = @id`,
  ).run({
    id,
    name: charm.name,
    price: charm.price,
    icon: charm.icon ?? null,
    tags: JSON.stringify(charm.tags ?? []),
  })
  return getCharm(id)
}

export function deleteCharm(id) {
  const stmt = db.prepare('DELETE FROM charms WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function countCharms() {
  const row = db.prepare('SELECT COUNT(*) AS count FROM charms').get()
  return Number(row?.count ?? 0)
}

export function getCasePrice(defaultValue = 18) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('case_price')
  if (!row) return defaultValue
  const parsed = Number(row.value)
  return Number.isNaN(parsed) ? defaultValue : parsed
}

export function setCasePrice(value) {
  db.prepare(
    `INSERT INTO settings(key, value)
     VALUES ('case_price', @value)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run({ value: String(value) })
  return getCasePrice(value)
}

export function getCatalogSnapshot() {
  return {
    casePrice: getCasePrice(),
    trinkets: listCharms(),
  }
}

export function countAdmins() {
  const row = db.prepare('SELECT COUNT(*) AS count FROM admins').get()
  return Number(row?.count ?? 0)
}

export function getAdminByUsername(username) {
  return db.prepare('SELECT id, username, password_hash FROM admins WHERE username = ?').get(username)
}

export function insertAdmin(username, passwordHash) {
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, passwordHash)
}

export function seedCatalogFromBundledFile() {
  if (countCharms() > 0) return
  const catalogPath = path.join(__dirname, '..', 'src', 'data', 'catalog.json')
  const raw = fs.readFileSync(catalogPath, 'utf-8')
  const parsed = JSON.parse(raw)
  const trinkets = Array.isArray(parsed.trinkets) ? parsed.trinkets : []
  const insert = db.prepare(
    `INSERT INTO charms (id, name, price, icon, tags, updated_at)
     VALUES (@id, @name, @price, @icon, @tags, CURRENT_TIMESTAMP)`,
  )
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run({
        id: item.id,
        name: item.name,
        price: item.price,
        icon: item.icon ?? null,
        tags: JSON.stringify(item.tags ?? []),
      })
    }
  })
  insertMany(trinkets)
  if (typeof parsed.casePrice === 'number') {
    setCasePrice(parsed.casePrice)
  }
}

export function resetAdminPassword(username, passwordHash) {
  db.prepare('UPDATE admins SET password_hash = ? WHERE username = ?').run(passwordHash, username)
}

export { dbPath }
