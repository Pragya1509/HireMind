// backend/routes/mentorship.js
// GET    /api/mentorship           → list all active mentors (public data only)
// POST   /api/mentorship/add       → add a mentor (admin/recruiter only)
// PUT    /api/mentorship/:id       → update mentor (admin/recruiter only)
// DELETE /api/mentorship/:id       → deactivate mentor (admin/recruiter only)
// POST   /api/mentorship/book      → send booking email to mentor

const express      = require('express');
const router       = express.Router();
const nodemailer   = require('nodemailer');
const Mentor       = require('../models/Mentor');
const { protect }  = require('../middleware/auth');

// ── Email transporter (Gmail) ──────────────────────────────────────────────
const getTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // Gmail App Password (NOT your account password)
  },
});

// ── GET all active mentors ─────────────────────────────────────────────────
// Returns public-safe fields ONLY — email is NEVER sent to frontend
router.get('/', async (req, res) => {
  try {
    const mentors = await Mentor.find({ isActive: true })
      .select('-email -__v')   // exclude email from public response
      .sort({ sessions: -1 }); // most experienced first

    res.status(200).json({ success: true, mentors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET single mentor (no email) ───────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id).select('-email -__v');
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });
    res.status(200).json({ success: true, mentor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST add a mentor (protected — recruiter/admin) ────────────────────────
router.post('/add', protect, async (req, res) => {
  try {
    const {
      name, role, company, companyLogo, experience, location,
      bio, expertise, languages, sessionDuration,
      email, rating, avatarColor, photoUrl
    } = req.body;

    if (!name || !role || !company || !bio || !email || !experience || !location) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const mentor = await Mentor.create({
      name, role, company, companyLogo, experience, location,
      bio,
      expertise:       expertise || [],
      languages:       languages || ['English'],
      sessionDuration: sessionDuration || '45 min',
      email,
      rating:          rating || 5.0,
      avatarColor:     avatarColor || '#7c3aed',
      photoUrl:        photoUrl || '',
    });

    // Return without email
    const safe = mentor.toObject();
    delete safe.email;

    res.status(201).json({ success: true, message: 'Mentor added successfully', mentor: safe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── PUT update mentor ──────────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const mentor = await Mentor.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    ).select('-email -__v');

    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });
    res.status(200).json({ success: true, mentor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── DELETE (deactivate) mentor ─────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    await Mentor.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Mentor deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST book a session ────────────────────────────────────────────────────
// Candidate fills form → backend fetches mentor email from DB (never exposed to frontend)
// → sends email to mentor + confirmation to candidate
router.post('/book', protect, async (req, res) => {
  try {
    const { mentorId, candidateName, candidateEmail, topic, message, preferredTime } = req.body;

    if (!mentorId || !candidateName || !candidateEmail || !topic) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Fetch mentor WITH email (server-side only)
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

    const transporter = getTransporter();

    // ── Email TO MENTOR ────────────────────────────────────────────────────
    await transporter.sendMail({
      from:    `"HireMind Mentorship" <${process.env.EMAIL_USER}>`,
      to:      mentor.email,
      subject: `📩 New Session Request from ${candidateName} — ${topic}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#1e1b4b,#4c1d95);padding:32px;border-radius:16px 16px 0 0;text-align:center;">
            <h1 style="color:white;font-size:22px;margin:0;">🚀 HireMind Mentorship</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">New Session Booking Request</p>
          </div>
          <div style="background:white;padding:28px;border:1px solid #e8e5df;border-top:none;">
            <p style="font-size:16px;color:#1c1916;">Hi <strong>${mentor.name}</strong>! You have a new mentorship request 🎉</p>

            <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:20px;margin:20px 0;">
              <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#7c3aed;margin:0 0 12px;">Candidate Details</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:5px 0;color:#78716c;width:130px;">Name</td><td style="font-weight:600;color:#1c1916;">${candidateName}</td></tr>
                <tr><td style="padding:5px 0;color:#78716c;">Email</td><td><a href="mailto:${candidateEmail}" style="color:#7c3aed;font-weight:600;">${candidateEmail}</a></td></tr>
                <tr><td style="padding:5px 0;color:#78716c;">Topic</td><td style="font-weight:600;color:#1c1916;">${topic}</td></tr>
                ${preferredTime ? `<tr><td style="padding:5px 0;color:#78716c;">Preferred Time</td><td style="font-weight:600;color:#1c1916;">${preferredTime}</td></tr>` : ''}
              </table>
            </div>

            ${message ? `
            <div style="background:#f9f8f6;border-left:3px solid #7c3aed;padding:14px;border-radius:0 8px 8px 0;margin-bottom:20px;">
              <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#7c3aed;margin:0 0 8px;">Message</p>
              <p style="font-size:14px;color:#44403a;line-height:1.6;margin:0;">${message}</p>
            </div>` : ''}

            <p style="font-size:14px;color:#44403a;line-height:1.6;">
              Simply <strong>reply to this email</strong> with your available time slots.
            </p>

            <a href="mailto:${candidateEmail}?subject=Re: Mentorship — ${topic}&body=Hi ${candidateName},%0A%0AThanks for reaching out! Here are my available slots:%0A%0A1. %0A2. %0A3. %0A%0ALet me know which works for you.%0A%0ABest,%0A${mentor.name}"
               style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;margin-top:8px;">
              ✉️ Reply to ${candidateName}
            </a>
          </div>
          <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:0 0 16px 16px;padding:16px;text-align:center;">
            <p style="font-size:12px;color:#a78bfa;margin:0;">HireMind Mentorship — This is an automated email. Do not reply directly to this message.</p>
          </div>
        </div>
      `,
    });

    // ── Confirmation email TO CANDIDATE ────────────────────────────────────
    await transporter.sendMail({
      from:    `"HireMind Mentorship" <${process.env.EMAIL_USER}>`,
      to:      candidateEmail,
      subject: `✅ Your request to ${mentor.name} was sent!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#1e1b4b,#4c1d95);padding:32px;border-radius:16px 16px 0 0;text-align:center;">
            <h1 style="color:white;font-size:22px;margin:0;">🚀 HireMind</h1>
          </div>
          <div style="background:white;padding:28px;border:1px solid #e8e5df;border-top:none;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:48px;margin-bottom:8px;">🎉</div>
              <h2 style="color:#1c1916;font-size:20px;margin:0;">Request Sent!</h2>
            </div>
            <p style="font-size:14px;color:#44403a;line-height:1.6;">
              Hi <strong>${candidateName}</strong>, your request has been sent to <strong>${mentor.name}</strong> (${mentor.company}) for a session on <strong>${topic}</strong>.
            </p>
            <div style="background:#f5f3ff;border-radius:10px;padding:16px;margin:16px 0;">
              <p style="font-weight:700;color:#7c3aed;font-size:13px;margin:0 0 10px;">What happens next?</p>
              <ul style="color:#44403a;font-size:13px;line-height:2;padding-left:18px;margin:0;">
                <li>${mentor.name} will review your request</li>
                <li>They'll reply with available time slots within 24–48 hrs</li>
                <li>Confirm a slot and join the session</li>
              </ul>
            </div>
            <p style="font-size:13px;color:#78716c;">Watch your inbox at <strong>${candidateEmail}</strong> for their reply.</p>
          </div>
          <div style="background:#f5f3ff;border-radius:0 0 16px 16px;padding:16px;text-align:center;border:1px solid #ddd6fe;border-top:none;">
            <p style="font-size:12px;color:#a78bfa;margin:0;">HireMind — AI-Powered Interview Platform</p>
          </div>
        </div>
      `,
    });

    // Increment session request count
    await Mentor.findByIdAndUpdate(mentorId, { $inc: { sessions: 1 } });

    res.status(200).json({ success: true, message: 'Booking request sent to mentor successfully' });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to send booking request', error: error.message });
  }
});

module.exports = router;