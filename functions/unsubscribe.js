export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    let email = formData.get('email');

    if (!email || !email.includes('@')) {
      return new Response('Invalid email', { status: 400 });
    }

    email = email.toLowerCase().trim();

    // Save to D1 database (creates table automatically on first run)
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS unsubscribed (
        email TEXT PRIMARY KEY,
        unsubscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.DB.prepare(`
      INSERT INTO unsubscribed (email) 
      VALUES (?) 
      ON CONFLICT(email) DO NOTHING
    `).bind(email).run();

    // Return the same beautiful page with success
    return Response.redirect('https://homeofrest.com/unsubscribe?success=1', 302);

  } catch (err) {
    console.error(err);
    return new Response('Something went wrong. Please try again.', { status: 500 });
  }
}
