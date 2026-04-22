import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { scenariosRouter } from './routes/scenarios'
import { reportRouter } from './routes/report'

type Bindings = {
  DB: D1Database
  REPORTS: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS — allow all origins for now; tighten in production
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  })
)

// Health check
app.get('/health', (c) => c.json({ success: true, data: { status: 'ok' } }))

// Routes
app.route('/api/scenarios', scenariosRouter)
app.route('/api/report', reportRouter)

// 404 fallback
app.notFound((c) => c.json({ success: false, error: 'Not found' }, 404))

// 500 fallback
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ success: false, error: 'Internal server error' }, 500)
})

export default app
