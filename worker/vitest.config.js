import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: path.resolve(__dirname, '../wrangler.toml') },
        miniflare: {
          // Enable in-memory D1 database for testing
          d1Databases: ['DB'],
          // Mock the PAYMENTS service binding for tests
          serviceBindings: {
            PAYMENTS: async (request) => {
              // Simple mock payment service that returns success for tests
              const url = new URL(request.url)
              const path = url.pathname
              
              // Mock responses for common payment endpoints
              if (path.includes('/checkout')) {
                return new Response(JSON.stringify({
                  checkoutId: 'test-checkout-id',
                  orderRef: 'test-order-ref'
                }), {
                  headers: { 'Content-Type': 'application/json' }
                })
              }
              
              return new Response(JSON.stringify({ ok: true }), {
                headers: { 'Content-Type': 'application/json' }
              })
            }
          }
        },
      },
    },
  },
})
