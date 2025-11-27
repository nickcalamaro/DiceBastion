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
        },
      },
    },
  },
})
