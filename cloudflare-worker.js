const NEVOBO_FEED_URL = 'https://api.nevobo.nl/export/vereniging/CKM0K9W/resultaten.rss';

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...extra,
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname !== '/resultaten.rss') {
      return new Response('Niet gevonden', {
        status: 404,
        headers: corsHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }),
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== 'GET') {
      return new Response('Methode niet toegestaan', {
        status: 405,
        headers: corsHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }),
      });
    }

    try {
      // Server-side ophalen: de browser-CORS-beperking geldt hier niet.
      const upstream = await fetch(NEVOBO_FEED_URL, {
        headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      });
      const xml = await upstream.text();

      if (!upstream.ok || !/<(?:\w+:)?rss\b|<(?:\w+:)?feed\b/i.test(xml)) {
        return new Response('Nevobo leverde geen geldige RSS-feed.', {
          status: 502,
          headers: corsHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }),
        });
      }

      return new Response(xml, {
        status: 200,
        headers: corsHeaders({
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        }),
      });
    } catch (error) {
      return new Response('De Nevobo-feed kon niet worden opgehaald.', {
        status: 502,
        headers: corsHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }),
      });
    }
  },
};
