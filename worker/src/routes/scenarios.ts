import { Hono } from 'hono'

// UUID v4 regex for validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Bindings = {
  DB: D1Database
}

type ScenarioRow = {
  id: string
  device_id: string
  label: string
  inputs_json: string
  outputs_json: string
  created_at: number
  updated_at: number
}

function isValidUUID(val: unknown): val is string {
  return typeof val === 'string' && UUID_RE.test(val)
}

function parseScenario(row: ScenarioRow) {
  return {
    id: row.id,
    device_id: row.device_id,
    label: row.label,
    inputs: JSON.parse(row.inputs_json),
    outputs: JSON.parse(row.outputs_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

const scenariosRouter = new Hono<{ Bindings: Bindings }>()

// POST /api/scenarios — save a scenario
scenariosRouter.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)

  if (!body || typeof body !== 'object') {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400)
  }

  const { device_id, label, inputs, outputs } = body as Record<string, unknown>

  if (!isValidUUID(device_id)) {
    return c.json({ success: false, error: 'device_id must be a valid UUID v4' }, 400)
  }
  if (typeof label !== 'string' || label.trim() === '') {
    return c.json({ success: false, error: 'label is required and must be a non-empty string' }, 400)
  }
  if (inputs === undefined || inputs === null) {
    return c.json({ success: false, error: 'inputs is required' }, 400)
  }

  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  try {
    await c.env.DB.prepare(
      `INSERT INTO scenarios (id, device_id, label, inputs_json, outputs_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        device_id,
        label.trim(),
        JSON.stringify(inputs ?? {}),
        JSON.stringify(outputs ?? {}),
        now,
        now
      )
      .run()

    return c.json({ success: true, data: { id, device_id, label: label.trim(), created_at: now } }, 201)
  } catch (err) {
    console.error('POST /api/scenarios error:', err)
    return c.json({ success: false, error: 'Failed to save scenario' }, 500)
  }
})

// GET /api/scenarios?device_id= — list scenarios for a device
scenariosRouter.get('/', async (c) => {
  const device_id = c.req.query('device_id')

  if (!isValidUUID(device_id)) {
    return c.json({ success: false, error: 'device_id query param must be a valid UUID v4' }, 400)
  }

  try {
    const result = await c.env.DB.prepare(
      `SELECT * FROM scenarios WHERE device_id = ? ORDER BY updated_at DESC LIMIT 100`
    )
      .bind(device_id)
      .all<ScenarioRow>()

    const data = (result.results ?? []).map(parseScenario)
    return c.json({ success: true, data })
  } catch (err) {
    console.error('GET /api/scenarios error:', err)
    return c.json({ success: false, error: 'Failed to list scenarios' }, 500)
  }
})

// GET /api/scenarios/:id — get a single scenario
scenariosRouter.get('/:id', async (c) => {
  const id = c.req.param('id')

  if (!isValidUUID(id)) {
    return c.json({ success: false, error: 'id must be a valid UUID v4' }, 400)
  }

  try {
    const row = await c.env.DB.prepare(`SELECT * FROM scenarios WHERE id = ?`)
      .bind(id)
      .first<ScenarioRow>()

    if (!row) {
      return c.json({ success: false, error: 'Scenario not found' }, 404)
    }

    return c.json({ success: true, data: parseScenario(row) })
  } catch (err) {
    console.error('GET /api/scenarios/:id error:', err)
    return c.json({ success: false, error: 'Failed to fetch scenario' }, 500)
  }
})

// DELETE /api/scenarios/:id — delete a scenario
scenariosRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')

  if (!isValidUUID(id)) {
    return c.json({ success: false, error: 'id must be a valid UUID v4' }, 400)
  }

  try {
    const existing = await c.env.DB.prepare(`SELECT id FROM scenarios WHERE id = ?`)
      .bind(id)
      .first<{ id: string }>()

    if (!existing) {
      return c.json({ success: false, error: 'Scenario not found' }, 404)
    }

    await c.env.DB.prepare(`DELETE FROM scenarios WHERE id = ?`).bind(id).run()

    return c.json({ success: true, data: { id } })
  } catch (err) {
    console.error('DELETE /api/scenarios/:id error:', err)
    return c.json({ success: false, error: 'Failed to delete scenario' }, 500)
  }
})

export { scenariosRouter }
