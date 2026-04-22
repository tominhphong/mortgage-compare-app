import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  REPORTS: R2Bucket
}

const reportRouter = new Hono<{ Bindings: Bindings }>()

// POST /api/report/generate — stub; R2 upload implemented in Sprint 5
reportRouter.post('/generate', async (c) => {
  // TODO Sprint 5: generate PDF, upload to REPORTS R2 bucket, return signed URL
  return c.json({ success: true, data: { url: 'stub-pending-implementation' } })
})

export { reportRouter }
