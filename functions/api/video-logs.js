export async function onRequestGet(context) {
  const { env } = context;

  try {
    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 1000;

    const result = await env.DB.prepare(`
      SELECT * FROM video_views 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).bind(limit).all();

    return new Response(JSON.stringify(result.results || []), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('video-logs GET error:', err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
