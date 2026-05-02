export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    let email = formData.get('email');

    if (!email || !email.includes('@')) {
      return new Response('Invalid email', { status: 400 });
    }

    email = email.toLowerCase().trim();

    // Create table if it doesn't exist
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS subscribers (
        email TEXT PRIMARY KEY,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Save email (ignore if already exists)
    await env.DB.prepare(`
      INSERT INTO subscribers (email) 
      VALUES (?) 
      ON CONFLICT(email) DO NOTHING
    `).bind(email).run();

    // Redirect back with success flag
    return Response.redirect('https://homeofrest.com/?subscribe=success', 302);

  } catch (err) {
    console.error(err);
    return new Response('Something went wrong. Please try again later.', { status: 500 });
  }
}
