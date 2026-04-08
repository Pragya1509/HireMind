console.log("🔥 GROQ SERVICE RUNNING");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const extractJSONArray = (text) => {
  try {
    const cleaned = text.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
};

const extractJSONObject = (text) => {
  try {
    const cleaned = text.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
};

// ── GENERATE QUESTIONS ────────────────────────────────────────────────────────
exports.generateQuestions = async (role, count = 5) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a JSON-only responder. Output raw JSON only. No markdown, no explanation."
        },
        {
          role: "user",
          content: `Generate exactly ${count} professional interview questions for a ${role} position.

Requirements:
- Mix: 40% behavioural (tell me about a time...), 40% technical/role-specific, 20% situational
- Each question must be specific to the ${role} role — not generic
- Difficulty should match the role seniority implied
- Each question needs 3-5 specific key points that a strong answer MUST cover

Return ONLY this JSON array:
[
  {
    "question": "Full question here?",
    "type": "behavioural",
    "expected": ["key point 1", "key point 2", "key point 3"]
  }
]`
        }
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const raw = completion.choices[0]?.message?.content || "";
    console.log("🎯 Questions raw:", raw.substring(0,400));
    const data = extractJSONArray(raw);
    if (!data) throw new Error("Invalid response");
    return data;

  } catch (error) {
    console.error("Question generation error:", error.message);
    return [
      { question: "Tell me about yourself and your most relevant experience.", type:"behavioural", expected:["background","key skills","recent achievement","career direction"] },
      { question: "Describe the most technically challenging problem you have solved.", type:"technical", expected:["problem complexity","your specific approach","tools/technologies","measurable outcome"] },
      { question: "How do you handle competing priorities and tight deadlines?", type:"situational", expected:["prioritisation method","stakeholder communication","real example","result"] },
      { question: "What is your greatest professional achievement and why?", type:"behavioural", expected:["specific situation","your role","actions taken","quantifiable result"] },
      { question: "Where do you want to be in your career in the next three years?", type:"behavioural", expected:["clear direction","skills to develop","alignment with role","ambition and realism"] },
    ];
  }
};

// ── ANALYZE ANSWER ─────────────────────────────────────────────────────────────
exports.analyzeAnswer = async (question, answer, role = '', expected = [], meta = {}) => {
  const wc = meta.wordCount || answer.trim().split(/\s+/).filter(Boolean).length;
  const fc = meta.fillerCount || 0;
  const trimmed = answer.trim().toLowerCase();

  // Hard gate for junk/empty answers
  const isJunk =
    trimmed.length < 10 ||
    trimmed === 'skipped' ||
    /^(sorry|i don'?t know|not sure|no idea|idk|n\/a|nothing|skip|-+)\.?$/.test(trimmed);

  if (isJunk) {
    return {
      analysis: "No meaningful answer was provided. This would be marked as unattempted in a real interview.",
      score: 0,
      scores: { relevance:0, depth:0, examples:0, structure:0, communication:0 },
      strengths: [],
      improvements: [
        "Always attempt an answer — even partial answers score better than silence.",
        "Use the STAR method: describe the Situation, your Task, the Actions you took, and the Result.",
        "Prepare 2-3 adaptable stories from real experience before your interview.",
      ],
      modelAnswer: "",
    };
  }

  const expectedList = expected && expected.length
    ? expected.map((p,i) => `${i+1}. ${p}`).join('\n')
    : '1. Relevant experience or knowledge\n2. Specific real example\n3. Clear outcome or result';

  const prompt = `You are a senior ${role || 'professional'} interviewer at a top company. You are strict, professional, and honest. Never inflate scores.

═══════════════════════════════
INTERVIEW QUESTION:
"${question}"

WHAT A STRONG ANSWER MUST INCLUDE:
${expectedList}

CANDIDATE'S ANSWER (${wc} words, ${fc} filler words detected):
"${answer}"
═══════════════════════════════

SCORING INSTRUCTIONS — score each dimension 0-20, be strict:

1. RELEVANCE (0-20)
   - Does the answer directly address what was asked?
   - 0-4: Completely off-topic, apology, or irrelevant
   - 5-9: Loosely related but misses the point
   - 10-14: Mostly addresses the question
   - 15-20: Directly and fully answers the question

2. DEPTH (0-20)
   - Is there sufficient substance and knowledge demonstrated?
   - 0-4: One sentence, vague platitude, or "I am good at this"
   - 5-9: Surface level, misses most key points
   - 10-14: Covers some key points with reasonable detail
   - 15-20: Comprehensive, covers most/all key points with insight

3. EXAMPLES (0-20)
   - Does the candidate support their answer with a real, specific example?
   - 0-2: No example at all
   - 3-7: Hypothetical or very generic example
   - 8-13: Real example but missing specifics (no names, numbers, context)
   - 14-20: Specific real example with context, actions, and outcome

4. STRUCTURE (0-20)
   - Is the answer well-organised and easy to follow?
   - 0-5: Completely rambling, hard to follow
   - 6-10: Some organisation but unclear progression
   - 11-15: Reasonably structured, logical flow
   - 16-20: Clear STAR structure or equivalent, easy to follow throughout

5. COMMUNICATION (0-20)
   - Clarity, professionalism, and confidence of expression
   - 0-5: Very unclear, excessive filler words, extremely short
   - 6-10: Understandable but rough or unprofessional
   - 11-15: Clear and professional
   - 16-20: Fluent, confident, articulate, minimal fillers

MANDATORY SCORE CAPS (apply before returning):
- Answer under 15 words → max total = 15
- Answer under 30 words → max total = 30
- Answer under 50 words → max total = 48
- Answer under 70 words with no specific example → max total = 55
- Generic answer with only buzzwords and no example → max relevance+examples = 8 each
- STAR structure present with specific example → minimum total can be 65
- Only award 80+ if: covers 3+ key expected points AND has specific real example AND clear structure
- Only award 90+ if: covers all key points, STAR structure, specific measurable result, fluent delivery
- Filler words: deduct 1 point from communication per 2 filler words (max -8)

MODEL ANSWER — CRITICAL RULES:
- You MUST write a complete, natural, first-person spoken answer to THIS exact question
- Length: 160-200 words exactly
- Write AS the candidate speaking, not about the candidate
- Start with "In my previous role..." or "In one of my projects..." or "I recall a time when..."
- NEVER write advice, tips, structure guides, or meta-commentary
- For behavioural: full STAR structure with realistic scenario, specific actions YOU took, measurable result
- For technical: real technologies, specific steps, at least one metric or outcome
- Tone: confident, natural, professional — like a well-prepared candidate speaking in an interview
- The answer must feel authentic, not like a template

Return ONLY raw JSON — no markdown, no text before or after:
{
  "scores": {
    "relevance": <integer 0-20>,
    "depth": <integer 0-20>,
    "examples": <integer 0-20>,
    "structure": <integer 0-20>,
    "communication": <integer 0-20>
  },
  "score": <integer — exact sum of the 5 scores above>,
  "analysis": "<2-3 sentences of specific, honest feedback referencing exactly what the candidate said and what was missing>",
  "strengths": ["<specific thing they did well — reference their actual words>", "<another specific strength>"],
  "improvements": ["<specific gap in their answer — be precise>", "<another specific improvement needed>"],
  "modelAnswer": "<Complete 160-200 word first-person answer to this specific question — spoken as the candidate>"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a strict professional interviewer evaluating real candidates. Output raw JSON only — no markdown, no preamble. Apply all score caps rigorously. Your modelAnswer must be a natural first-person spoken answer, never advice."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.15,
      max_tokens: 1800,
    });

    const raw = completion.choices[0]?.message?.content || "";
    console.log("🧠 Analysis raw:", raw.substring(0,500));
    const result = extractJSONObject(raw);
    if (!result) throw new Error("Parse failed: " + raw.substring(0,200));

    // Enforce score caps as final safety net
    let finalScore = result.score ?? 50;
    if (wc < 15)       finalScore = Math.min(finalScore, 15);
    else if (wc < 30)  finalScore = Math.min(finalScore, 30);
    else if (wc < 50)  finalScore = Math.min(finalScore, 48);
    else if (wc < 70 && !answer.match(/\b(when|example|project|time|situation|at my|in my|previous|last year|worked on|built|led|managed)\b/i)) {
      finalScore = Math.min(finalScore, 55);
    }
    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    const scores = result.scores || { relevance:0, depth:0, examples:0, structure:0, communication:0 };

    return {
      analysis:     result.analysis     || "Answer recorded.",
      score:        finalScore,
      scores,
      strengths:    Array.isArray(result.strengths)    ? result.strengths    : [],
      improvements: Array.isArray(result.improvements) ? result.improvements : [],
      modelAnswer:  result.modelAnswer  || "",
    };

  } catch (error) {
    console.error("Analysis error:", error.message);
    return {
      analysis: "Analysis failed. Please check your connection and try again.",
      score: 35,
      scores: { relevance:7, depth:7, examples:7, structure:7, communication:7 },
      strengths: ["Attempted to answer"],
      improvements: ["Add a specific real-world example", "Use STAR method", "Include measurable outcomes"],
      modelAnswer: "",
    };
  }
};

// ── AI CHAT RESPONSE ──────────────────────────────────────────────────────────
exports.generateAIResponse = async (context, message) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role:"system", content:"You are a professional interviewer. Reply in 1-2 lines naturally and concisely." },
        { role:"user",   content:`Context: ${context}\nCandidate said: ${message}` }
      ],
      temperature: 0.5,
    });
    return completion.choices[0]?.message?.content || "Thank you. Let's continue.";
  } catch (error) {
    console.error("AI response error:", error.message);
    return "Thank you for your answer. Let's continue.";
  }
};