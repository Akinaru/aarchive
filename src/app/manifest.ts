import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aarchive',
    short_name: 'Aarchive',
    description: 'Version mobile de Aarchive',
    start_url: '/',
    display: 'standalone',
    background_color: '#121213',
    theme_color: '#f56565',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
