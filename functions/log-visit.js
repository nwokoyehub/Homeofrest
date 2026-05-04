export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { session_id, duration } = data;

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const country = request.cf?.country || 'unknown';
    const referer = request.headers.get('referer') || 'direct';
    const now = new Date().toISOString();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        ip TEXT,
        country TEXT,
        referer TEXT DEFAULT 'direct',
        start_time TEXT,
        duration INTEGER DEFAULT 0,
        last_updated TEXT
      )
    `).run();

    // Check if session exists
    const existing = await env.DB.prepare(
      `SELECT id FROM access_logs WHERE session_id = ?`
    ).bind(session_id).first();

    if (existing) {
      // Update existing session
      await env.DB.prepare(`
        UPDATE access_logs 
        SET duration = ?, last_updated = ?
        WHERE session_id = ?
      `).bind(Math.round(duration || 0), now, session_id).run();
    } else {
      // Insert new session
      await env.DB.prepare(`
        INSERT INTO access_logs (session_id, ip, country, referer, start_time, duration, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(session_id, ip, country, referer, now, Math.round(duration || 0), now).run();
    }

    return new Response('Logged', { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    console.error('log-visit error:', err);
    return new Response('Error: ' + err.message, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
