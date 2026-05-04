export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { email } = data;

    // Validate email
    if (!email || !email.includes('@') || !email.includes('.')) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Please provide a valid email address.' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const country = request.cf?.country || 'unknown';
    const now = new Date().toISOString();

    // Create subscribers table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        ip TEXT,
        country TEXT,
        subscribed_at TEXT,
        status TEXT DEFAULT 'active'
      )
    `).run();

    // Insert subscriber
    try {
      await env.DB.prepare(`
        INSERT INTO subscribers (email, ip, country, subscribed_at, status)
        VALUES (?, ?, ?, ?, ?)
      `).bind(normalizedEmail, ip, country, now, 'active').run();
    } catch (insertErr) {
      // If UNIQUE constraint fails, email already exists
      if (insertErr.message && insertErr.message.includes('UNIQUE')) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'You are already subscribed! Check your inbox for our welcome email.' 
        }), {
          status: 409,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      throw insertErr;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Successfully subscribed to Home of Rest!' 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    console.error('subscribe error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Server error: ' + err.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
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
