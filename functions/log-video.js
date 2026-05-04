export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { session_id, video_id, video_title, watch_time_seconds } = data;

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const country = request.cf?.country || 'unknown';
    const referer = request.headers.get('referer') || 'direct';
    const now = new Date().toISOString();

    // Create table if it doesn't exist
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS video_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        video_id TEXT,
        video_title TEXT,
        watch_time_seconds INTEGER DEFAULT 0,
        ip TEXT,
        country TEXT,
        referer TEXT DEFAULT 'direct',
        timestamp TEXT,
        UNIQUE(session_id, video_id)
      )
    `).run();

    // Simple and reliable UPSERT
    await env.DB.prepare(`
      INSERT INTO video_views (session_id, video_id, video_title, watch_time_seconds, ip, country, referer, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id, video_id) 
      DO UPDATE SET 
        watch_time_seconds = MAX(video_views.watch_time_seconds, excluded.watch_time_seconds),
        timestamp = excluded.timestamp
    `).bind(
      session_id, 
      video_id, 
      video_title, 
      Math.round(watch_time_seconds || 0), 
      ip, 
      country, 
      referer, 
      now
    ).run();

    return new Response('Video logged', { status: 200 });
  } catch (err) {
    console.error('log-video error:', err);
    return new Response('Error: ' + err.message, { status: 500 });
  }
}
