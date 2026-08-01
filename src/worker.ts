export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return Response.json(
        {
          ok: true,
          project: 'hizach-flights',
          purpose: 'personal-non-commercial',
        },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      )
    }

    return Response.json(
      { error: 'Not found' },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  },
} satisfies ExportedHandler
/// <reference types="@cloudflare/workers-types" />
