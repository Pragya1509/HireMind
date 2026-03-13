// Backend/routes/avatar.js
// Uses api.heygen.com (confirmed working with sk_V2_hg keys)

const express = require('express');
const https   = require('https');
const router  = express.Router();
const { protect } = require('../middleware/auth');

const agent = new https.Agent({ rejectUnauthorized: false });

function post(hostname, path, apiKey) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname, path,
      method: 'POST',
      agent,
      headers: {
        'x-api-key':      apiKey,
        'Content-Type':   'application/json',
        'Content-Length': 0
      }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { reject(new Error('Non-JSON response: ' + d.substring(0, 100))); }
      });
    });
    req.on('error', err => reject(new Error(err.message)));
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timed out after 15s')); });
    req.end();
  });
}

// POST /api/avatar/heygen-token
router.post('/heygen-token', protect, async (req, res) => {
  const apiKey = (process.env.HEYGEN_API_KEY || '').trim();

  if (!apiKey || apiKey.length < 10) {
    return res.json({ success: false, message: 'HEYGEN_API_KEY not set in Backend/.env' });
  }

  console.log('🔄 Requesting HeyGen streaming token...');

  try {
    const r = await post('api.heygen.com', '/v1/streaming.create_token', apiKey);

    console.log('   Status:', r.status);

    if (r.status === 401) {
      return res.json({
        success: false,
        message: 'API key is invalid or expired.\n\nFix:\n1. Go to app.heygen.com\n2. Profile → Settings → API\n3. Delete old token → Generate Trial Token\n4. Update Backend/.env\n5. Restart server'
      });
    }

    if (r.status !== 200) {
      return res.json({
        success: false,
        message: `HeyGen error (${r.status}): ${r.body?.message || JSON.stringify(r.body)}`
      });
    }

    const token = r.body?.data?.token;
    if (!token) {
      return res.json({
        success: false,
        message: 'No token in response: ' + JSON.stringify(r.body)
      });
    }

    console.log('✅ HeyGen token generated successfully');
    res.json({ success: true, token });

  } catch (err) {
    console.error('❌ Token error:', err.message);
    res.json({ success: false, message: 'Network error: ' + err.message });
  }
});

// GET /api/avatar/list
router.get('/list', protect, (req, res) => {
  res.json({
    success: true,
    avatars: [
      { avatar_id: 'Anna_public_3_20240108',  avatar_name: 'Anna'  },
      { avatar_id: 'Tyler-incasual-20220722',  avatar_name: 'Tyler' },
      { avatar_id: 'Susan_public_2_20240328',  avatar_name: 'Susan' },
      { avatar_id: 'Wayne_20240711',           avatar_name: 'Wayne' },
    ]
  });
});

// POST /api/avatar/create-session - Create streaming session directly
router.post('/create-session', protect, async (req, res) => {
  const apiKey = (process.env.HEYGEN_API_KEY || '').trim();
  const { avatarId, quality } = req.body;

  if (!apiKey) {
    return res.json({ success: false, message: 'HEYGEN_API_KEY not set' });
  }

  console.log('🔄 Creating streaming session for avatar:', avatarId);

  try {
    // First get a token
    const tokenResp = await post('api.heygen.com', '/v1/streaming.create_token', apiKey);
    
    if (tokenResp.status !== 200) {
      return res.json({ success: false, message: 'Failed to get token' });
    }

    const token = tokenResp.body?.data?.token;
    
    // Now try to create the session using the token
    const sessionData = JSON.stringify({
      quality: quality || 'low',
      avatar_name: avatarId,
    });

    const opts = {
      hostname: 'api.heygen.com',
      path: '/v1/streaming.new',
      method: 'POST',
      agent,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(sessionData)
      }
    };

    const sessionReq = https.request(opts, sessionRes => {
      let data = '';
      sessionRes.on('data', chunk => data += chunk);
      sessionRes.on('end', () => {
        console.log('   Session status:', sessionRes.statusCode);
        
        try {
          const parsed = JSON.parse(data);
          if (sessionRes.statusCode === 200) {
            console.log('✅ Session created successfully');
            res.json({ success: true, session: parsed.data, token });
          } else {
            console.error('❌ Session failed:', data);
            res.json({ 
              success: false, 
              message: `Session creation failed (${sessionRes.statusCode}): ${parsed.message || 'Unknown error'}. Your HeyGen plan may not support streaming avatars.`,
              statusCode: sessionRes.statusCode,
              details: parsed
            });
          }
        } catch (e) {
          res.json({ success: false, message: 'Invalid response from HeyGen', raw: data });
        }
      });
    });

    sessionReq.on('error', err => {
      console.error('❌ Session request error:', err);
      res.json({ success: false, message: err.message });
    });

    sessionReq.setTimeout(20000, () => {
      sessionReq.destroy();
      res.json({ success: false, message: 'Session creation timed out after 20s' });
    });

    sessionReq.write(sessionData);
    sessionReq.end();

  } catch (err) {
    console.error('❌ Create session error:', err.message);
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;