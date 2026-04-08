// backend/controllers/aiController.js
// COMPLETE FILE — replace your existing aiController.js with this entire file

const Report    = require('../models/Report');
const aiService = require('../services/groqService');

// ── GENERATE QUESTIONS ────────────────────────────────────────────────────────
exports.generateQuestions = async (req, res) => {
  try {
    const { role, count = 5 } = req.body;
    if (!role) return res.status(400).json({ success:false, message:'Role is required' });
    const rawQuestions = await aiService.generateQuestions(role, count);
    const questions    = rawQuestions.map(q => typeof q === 'string' ? q : q.question);
    res.status(200).json({ success:true, questions });
  } catch (error) {
    console.error('Question generation error:', error.message);
    res.status(500).json({ success:false, message:'Failed to generate questions' });
  }
};

// ── ANALYZE ANSWER ────────────────────────────────────────────────────────────
exports.analyzeAnswer = async (req, res) => {
  try {
    const { question, answer, role = '' } = req.body;
    if (!question || !answer)
      return res.status(400).json({ success:false, message:'question and answer are required' });

    const result = await aiService.analyzeAnswer(question, answer, role);

    res.status(200).json({
      success:      true,
      analysis:     result.analysis     || '',
      score:        result.score        ?? 50,
      strengths:    result.strengths    || [],
      improvements: result.improvements || [],
      modelAnswer:  result.modelAnswer  || result.model_answer || '',
    });
  } catch (error) {
    console.error('Analyze answer error:', error.message);
    res.status(500).json({ success:false, message:'Failed to analyze answer' });
  }
};

// ── GET AI RESPONSE ───────────────────────────────────────────────────────────
exports.getAIResponse = async (req, res) => {
  try {
    const { context = '', userMessage = '' } = req.body;
    const response = await aiService.generateAIResponse(context, userMessage);
    res.status(200).json({ success:true, response });
  } catch (error) {
    res.status(500).json({ success:false, message:'Failed to get AI response' });
  }
};

// ── SAVE REPORT ───────────────────────────────────────────────────────────────
exports.saveReport = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ success:false, message:'User not authenticated' });

    const {
      role, avgScore, totalQuestions,
      answeredQuestions, strongAnswers, records,
    } = req.body;

    if (!role || avgScore === undefined)
      return res.status(400).json({ success:false, message:'role and avgScore are required' });

    const report = await Report.create({
      user:              req.user.id,
      role,
      avgScore:          Number(avgScore)          || 0,
      totalQuestions:    Number(totalQuestions)    || 0,
      answeredQuestions: Number(answeredQuestions) || 0,
      strongAnswers:     Number(strongAnswers)     || 0,
      records: (records || []).map(r => ({
        question:     r.question     || '',
        answer:       r.answer       || '',
        analysis:     r.analysis     || '',
        score:        Number(r.score)       || 0,
        strengths:    Array.isArray(r.strengths)    ? r.strengths    : [],
        improvements: Array.isArray(r.improvements) ? r.improvements : [],
        modelAnswer:  r.modelAnswer  || r.model_answer || '',
        wordCount:    Number(r.wordCount)   || 0,
        fillerCount:  Number(r.fillerCount) || 0,
        skipped:      Boolean(r.skipped),
      })),
    });

    console.log('✅ Report saved | user:', req.user.id, '| role:', role, '| records:', records?.length);
    res.status(201).json({ success:true, report });

  } catch (error) {
    console.error('Save report error:', error.message);
    res.status(500).json({ success:false, message:'Failed to save report' });
  }
};

// ── GET MY REPORTS ────────────────────────────────────────────────────────────
exports.getMyReports = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ success:false, message:'Not authenticated' });

    const reports = await Report.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success:true, reports });
  } catch (error) {
    console.error('Get reports error:', error.message);
    res.status(500).json({ success:false, message:'Failed to fetch reports' });
  }
};

// ── GENERATE INTERVIEW ROADMAP ────────────────────────────────────────────────
exports.generateRoadmap = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Not authenticated' });

    const { role, experience, weakAreas = [], targetCompanies = [] } = req.body;

    if (!role || !experience)
      return res.status(400).json({ success: false, message: 'role and experience are required' });

    // Fetch past reports to personalise the roadmap
    const reports = await Report.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    let performanceContext = '';
    if (reports.length > 0) {
      const avgScore = Math.round(reports.reduce((a, r) => a + r.avgScore, 0) / reports.length);
      const allRecords = reports.flatMap(r => r.records || []);
      const lowScoreQs = allRecords
        .filter(r => r.score < 50)
        .map(r => r.question)
        .slice(0, 5);
      performanceContext = `
The candidate has completed ${reports.length} practice interview(s) with an average score of ${avgScore}/100.
${lowScoreQs.length > 0 ? `They struggled with: ${lowScoreQs.join('; ')}` : ''}
${weakAreas.length > 0 ? `Self-identified weak areas: ${weakAreas.join(', ')}` : ''}
      `.trim();
    }

    const prompt = `
You are an expert interview coach. Generate a personalized week-by-week interview preparation roadmap.

Candidate Profile:
- Role: ${role}
- Experience Level: ${experience}
- Target Companies: ${targetCompanies.length > 0 ? targetCompanies.join(', ') : 'General tech companies'}
${performanceContext ? `\nPast Performance:\n${performanceContext}` : ''}

Generate a 6-week structured roadmap as a JSON object with this EXACT structure:
{
  "title": "Personalized ${role} Interview Roadmap",
  "summary": "2-3 sentence overview of the plan",
  "targetScore": 85,
  "estimatedHours": 42,
  "weeks": [
    {
      "week": 1,
      "theme": "Week theme title",
      "focus": "Primary focus area",
      "hours": 7,
      "topics": [
        {
          "name": "Topic name",
          "type": "concept",
          "priority": "high",
          "resources": ["Resource 1", "Resource 2"],
          "tip": "One specific actionable tip"
        }
      ],
      "milestone": "What the candidate should achieve by end of week",
      "dailyTask": "One 15-minute daily habit for this week"
    }
  ],
  "keySkills": [
    { "skill": "Skill name", "currentLevel": 3, "targetLevel": 8, "importance": "high" }
  ],
  "interviewTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Make it specific to ${role} at ${experience} level. Include real resources (LeetCode, System Design Primer, CTCI, NeetCode, etc). Return ONLY valid JSON, no markdown backticks.
`;

    const raw = await aiService.generateAIResponse('', prompt);

    let roadmap;
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      roadmap = JSON.parse(cleaned);
    } catch {
      roadmap = buildFallbackRoadmap(role, experience);
    }

    res.status(200).json({ success: true, roadmap });

  } catch (error) {
    console.error('Generate roadmap error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to generate roadmap' });
  }
};

function buildFallbackRoadmap(role, experience) {
  return {
    title: `${role} Interview Roadmap`,
    summary: `A structured 6-week plan for ${role} interviews at ${experience} level. Build fundamentals first, then advance to mock interviews.`,
    targetScore: 85,
    estimatedHours: 42,
    weeks: [
      { week:1, theme:'Foundations & Self-Assessment', focus:'Core concepts review', hours:6,
        topics:[
          { name:'Data Structures Review', type:'concept', priority:'high', resources:['CTCI Ch 1-3','LeetCode Easy'], tip:'Solve 2 easy problems daily' },
          { name:'Resume & STAR Stories', type:'practice', priority:'high', resources:['Levels.fyi'], tip:'Prepare top 3 achievements now' },
        ], milestone:'Solve easy LeetCode problems comfortably', dailyTask:'1 LeetCode easy + 1 STAR story review' },
      { week:2, theme:'Core Algorithms', focus:'Arrays, Strings & Hash Maps', hours:8,
        topics:[
          { name:'Arrays & Strings', type:'practice', priority:'high', resources:['LeetCode Top 150','NeetCode.io'], tip:'Pattern-match before coding' },
          { name:'Hash Maps & Sets', type:'concept', priority:'high', resources:['Grokking Algorithms'], tip:'Understand O(1) lookup tradeoffs' },
        ], milestone:'Comfortable with medium array & hashmap problems', dailyTask:'2 LeetCode mediums + solution review' },
      { week:3, theme:'Advanced DSA', focus:'Trees, Graphs & DP', hours:8,
        topics:[
          { name:'Binary Trees & BST', type:'practice', priority:'high', resources:['LeetCode Trees','NeetCode'], tip:'Draw tree before coding' },
          { name:'Dynamic Programming', type:'concept', priority:'medium', resources:['Grokking DP Patterns'], tip:'Memoization first, then tabulation' },
        ], milestone:'Solve medium tree & basic DP problems', dailyTask:'Study one new algorithm pattern' },
      { week:4, theme:'System Design', focus:'Scalable architecture', hours:8,
        topics:[
          { name:'System Design Fundamentals', type:'concept', priority:'high', resources:['System Design Primer (GitHub)','ByteByteGo'], tip:'Requirements → Estimation → Design' },
          { name:'Real System Walkthroughs', type:'practice', priority:'high', resources:['Designing Data-Intensive Apps'], tip:'Design 1 real system per day' },
        ], milestone:'Design URL shortener, chat app, news feed from scratch', dailyTask:'One system design case study' },
      { week:5, theme:'Behavioural & Role-Specific', focus:'Soft skills mastery', hours:6,
        topics:[
          { name:'STAR Method Mastery', type:'practice', priority:'high', resources:['Amazon LP','interviewing.io'], tip:'Prepare 8-10 polished STAR stories' },
          { name:`${role}-Specific Prep`, type:'concept', priority:'high', resources:['Glassdoor','Blind'], tip:'Research the exact role deeply' },
        ], milestone:'Polished answers for top 20 behavioural questions', dailyTask:'Record yourself answering 1 question' },
      { week:6, theme:'Mock Interviews & Final Polish', focus:'Full simulation', hours:6,
        topics:[
          { name:'Full Mock Interviews', type:'mock', priority:'high', resources:['Pramp','ARIA Practice'], tip:'No notes — full simulation conditions' },
          { name:'Targeted Weak Area Drill', type:'practice', priority:'high', resources:['LeetCode company lists'], tip:'Focus only on known weak spots' },
        ], milestone:'Ready to interview at target companies with confidence', dailyTask:'1 full mock interview session' },
    ],
    keySkills: [
      { skill:'Data Structures & Algorithms', currentLevel:4, targetLevel:8, importance:'high' },
      { skill:'System Design', currentLevel:3, targetLevel:7, importance:'high' },
      { skill:'Behavioural / STAR', currentLevel:5, targetLevel:9, importance:'high' },
      { skill:'Domain Knowledge', currentLevel:5, targetLevel:8, importance:'medium' },
      { skill:'Communication', currentLevel:6, targetLevel:9, importance:'medium' },
    ],
    interviewTips: [
      'Think out loud — interviewers want to see your reasoning process, not just the answer.',
      'Clarify requirements before coding — always ask about edge cases and constraints first.',
      'Start brute-force, then optimise — never say "I need the perfect solution" before starting.',
    ],
  };
}