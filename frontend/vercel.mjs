const configuredOrigin = process.env.RAILWAY_API_ORIGIN

if (!configuredOrigin) {
  throw new Error('RAILWAY_API_ORIGIN must be configured in Vercel.')
}

const apiOrigin = new URL(configuredOrigin)
if (apiOrigin.protocol !== 'https:' || apiOrigin.origin !== configuredOrigin.replace(/\/$/, '')) {
  throw new Error('RAILWAY_API_ORIGIN must be an HTTPS origin without a path.')
}

export const config = {
  framework: 'vite',
  rewrites: [
    {
      // Regex instead of :path* so Django's trailing slashes are preserved.
      source: '/api/(.*)',
      destination: `${apiOrigin.origin}/api/$1`,
    },
    {
      source: '/(.*)',
      destination: '/index.html',
    },
  ],
  headers: [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
}
