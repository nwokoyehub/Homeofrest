export async function onRequestPost({ request, env }) {
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
        session_id TEXT UNIQUE,
        ip TEXT,
        country TEXT,
        referer TEXT DEFAULT 'direct',
        start_time TEXT,
        duration INTEGER DEFAULT 0,
        last_updated TEXT
      )
    `).run();

    if (duration === undefined || duration === null) {
      await env.DB.prepare(`
        INSERT INTO access_logs (session_id, ip, country, referer, start_time, last_updated)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(session_id, ip, country, referer, now, now).run();
    } else {
      await env.DB.prepare(`
        UPDATE access_logs 
        SET duration = ?, last_updated = ?
        WHERE session_id = ?
      `).bind(Math.round(duration), now, session_id).run();
    }

    return new Response('Logged', { status: 200 });
  } catch (err) {
    console.error('log-visit error:', err);
    return new Response('Error: ' + err.message, { status: 500 });
  }
}
