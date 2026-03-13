// Backend/check-avatars.js
require('dotenv').config();
const https = require('https');

// Bypass SSL cert verification (fixes Windows certificate issues)
const agent = new https.Agent({ rejectUnauthorized: false });

function call(method, hostname, path, apiKey, body) {
  return new Promise((resolve, reject) => {
    const b = body ? JSON.stringify(body) : '';
    const opts = {
      hostname, path, method, agent,
      headers: {
        'X-API-KEY':      apiKey,
        'x-api-key':      apiKey,
        'Content-Type':   'application/json',
        'accept':         'application/json',
        'Content-Length': Buffer.byteLength(b)
      }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timed out')); });
    if (b) req.write(b);
    req.end();
  });
}

async function main() {
  console.log('\n==============================');
  console.log('  HireMind — API Key Checker');
  console.log('==============================\n');

  const KEY = (process.env.HEYGEN_API_KEY || '').trim();
  if (!KEY || KEY.length < 10) {
    console.error('❌ HEYGEN_API_KEY not found in Backend/.env\n');
    console.error('Add this line to Backend/.env:');
    console.error('   HEYGEN_API_KEY=your_key_here\n');
    process.exit(1);
  }
  console.log('✅ Key found:', KEY.substring(0,8) + '...' + KEY.slice(-4), `(${KEY.length} chars)\n`);

  // ── Try LiveAvatar endpoint ───────────────────────────────────────────────
  console.log('🔄 Testing api.liveavatar.com...');
  try {
    const r = await call('POST', 'api.liveavatar.com', '/v1/sessions/token', KEY, {
      mode: 'LITE',
      avatar_id: 'Anna_public_3_20240108',
      avatar_persona: { voice_id: 'en-US-JennyNeural', language: 'en' },
      interactivity_type: 'CONVERSATIONAL'
    });

    console.log('   Status:', r.status);
    const token = r.body?.data?.session_token || r.body?.data?.token;

    if (r.status === 200 && token) {
      console.log('\n🎉 SUCCESS via api.liveavatar.com!');
      console.log('   Token:', token.substring(0,20) + '...\n');
      printSuccess();
      return;
    }
    if (r.status === 401) {
      console.log('   ❌ Key rejected (401) by LiveAvatar\n');
    } else {
      console.log('   Response:', JSON.stringify(r.body).substring(0, 150));
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }

  // ── Try old HeyGen endpoint ───────────────────────────────────────────────
  console.log('\n🔄 Trying api.heygen.com (old endpoint)...');
  try {
    const r = await call('POST', 'api.heygen.com', '/v1/streaming.create_token', KEY, null);
    console.log('   Status:', r.status);

    const token = r.body?.data?.token;
    if (r.status === 200 && token) {
      console.log('\n🎉 SUCCESS via api.heygen.com!');
      console.log('   Token:', token.substring(0,20) + '...\n');
      printSuccess();
      return;
    }
    if (r.status === 401) {
      console.log('   ❌ Key rejected (401) by HeyGen\n');
      printKeyInvalid();
      return;
    }
    console.log('   Response:', JSON.stringify(r.body).substring(0, 150));
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }

  // ── Both failed ───────────────────────────────────────────────────────────
  console.error('\n❌ Both endpoints failed.\n');
  console.error('Most likely cause: API key has EXPIRED or is INVALID.');
  printKeyInvalid();
}

function printSuccess() {
  console.log('==============================');
  console.log('✅ YOUR KEY WORKS!');
  console.log('   Restart backend: node server.js');
  console.log('   Then click 🤖 on the site!');
  console.log('==============================\n');
}

function printKeyInvalid() {
  console.error('HOW TO GET A FRESH KEY:');
  console.error('  1. Go to https://app.heygen.com');
  console.error('  2. Click your avatar (bottom-left) → Settings');
  console.error('  3. Click the "API" tab');
  console.error('  4. Delete old token → "Generate Trial Token"');
  console.error('  5. Copy the ENTIRE new token');
  console.error('  6. Update Backend/.env:  HEYGEN_API_KEY=new_token');
  console.error('  7. Restart server and run this script again\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });