import type { NextConfig } from 'next'

import './src/env-client'
import './src/env-server'

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@workspace/api',
    '@workspace/auth',
    '@workspace/common',
    '@workspace/db',
    '@workspace/game-family-feud',
    '@workspace/game-jeopardy',
    '@workspace/realtime',
    '@workspace/ui',
  ],
}

export default config
