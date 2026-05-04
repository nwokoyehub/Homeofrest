export async function onRequestGet({ env }) {
  try {
    const accessLogs = await env.DB.prepare(`
      SELECT * FROM access_logs ORDER BY id DESC
    `).all();

    const videoViews = await env.DB.prepare(`
      SELECT * FROM video_views ORDER BY id DESC
    `).all();

    return Response.json({
      access_logs: accessLogs.results || [],
      video_views: videoViews.results || []
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
