// backend/services/aiService.js
// Using Groq API - free and unlimited!
// Get your key from: https://console.groq.com

const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY // fallback to Gemini key name if not set
});

// Generate interview questions based on role
exports.generateInterviewQuestions = async (role, count = 5) => {
  try {
    const prompt = `Generate ${count} professional interview questions for a ${role} position. 
    Return ONLY a numbered list of questions, one per line.
    Make them relevant, specific, and insightful.
    
    Example format:
    1. Question here?
    2. Question here?
    3. Question here?`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile', // Groq's fastest, most capable model
      temperature: 0.7,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || '';
    
    console.log('✅ Groq questions generated successfully');
    
    // Parse questions from response
    const questions = text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(q => q.length > 10 && q.includes('?'))
      .slice(0, count);

    if (questions.length === 0) {
      throw new Error('Failed to parse questions');
    }

    console.log('Parsed questions:', questions);
    return questions;

  } catch (error) {
    console.error('❌ Groq Error (using fallback questions):', error.message);
    return getFallbackQuestions(role, count);
  }
};

// Fallback questions function
function getFallbackQuestions(role, count = 5) {
  const fallbackQuestions = {
    'software engineer': [
      'Can you describe your experience with object-oriented programming?',
      'How do you approach debugging complex issues in production?',
      'What is your experience with version control systems like Git?',
      'Can you explain the difference between REST and GraphQL APIs?',
      'Describe a challenging technical project you worked on and how you solved it.',
      'How do you stay updated with new technologies and programming languages?',
      'Explain your approach to writing clean, maintainable code.',
      'What testing strategies do you use in your development process?'
    ],
    'product manager': [
      'How do you prioritize features in a product roadmap?',
      'Describe your experience working with cross-functional teams.',
      'How do you gather and incorporate user feedback?',
      'What metrics do you use to measure product success?',
      'Can you walk me through how you would launch a new product feature?',
      'How do you handle conflicting stakeholder priorities?',
      'Describe a time when you had to make a difficult product decision.',
      'What frameworks do you use for product strategy?'
    ],
    'data scientist': [
      'Can you explain your experience with machine learning algorithms?',
      'How do you approach data cleaning and preprocessing?',
      'What statistical methods do you commonly use?',
      'Describe a data analysis project that had significant business impact.',
      'How do you communicate technical findings to non-technical stakeholders?',
      'What tools and technologies do you prefer for data analysis?',
      'Explain how you would handle missing or incomplete data.',
      'How do you validate your models?'
    ],
    'designer': [
      'Can you walk me through your design process?',
      'How do you approach user research and testing?',
      'Describe a challenging design problem you solved.',
      'How do you balance user needs with business requirements?',
      'What design tools and software are you most proficient in?',
      'How do you handle feedback and criticism on your designs?',
      'Describe your experience with design systems.',
      'How do you stay current with design trends?'
    ]
  };

  const normalizedRole = role.toLowerCase();
  
  for (const [key, questions] of Object.entries(fallbackQuestions)) {
    if (normalizedRole.includes(key)) {
      return questions.slice(0, count);
    }
  }
  
  const defaultQuestions = [
    `Tell me about your experience in the ${role} field.`,
    `What are your greatest strengths for this ${role} position?`,
    `Describe a challenging situation you faced in your ${role} work and how you handled it.`,
    `What motivates you in your ${role} career?`,
    `Where do you see yourself in 5 years in the ${role} field?`,
    `Why are you interested in this ${role} opportunity?`,
    `How do you handle tight deadlines and pressure in ${role} work?`,
    `What unique skills do you bring to this ${role} position?`
  ];
  
  return defaultQuestions.slice(0, count);
}

// Analyze answer with Groq AI - PERSONALIZED ANALYSIS
exports.analyzeAnswer = async (question, answer) => {
  try {
    const wordCount = answer.trim().split(/\s+/).length;
    
    console.log(`\n📊 Analyzing answer for: "${question}"`);
    console.log(`📝 Candidate's answer (${wordCount} words): "${answer}"`);
    
    const prompt = `You are an expert interviewer providing personalized feedback. Analyze this specific answer carefully.

QUESTION: "${question}"

CANDIDATE'S ANSWER: "${answer}"

WORD COUNT: ${wordCount} words

Provide specific, personalized feedback (2-3 sentences) that:
1. Directly mentions what the candidate said in their answer
2. Evaluates if they answered THIS specific question well
3. Gives ONE actionable suggestion for improvement

RULES:
- If under 10 words: Tell them it's too brief and suggest STAR method (Situation, Task, Action, Result) with 30-50 words
- If 10-30 words but vague: Ask for specific examples related to this question
- If 30+ words with examples: Praise what they did well, suggest one enhancement
- Always reference their actual answer content

Be constructive, encouraging, and SPECIFIC to what they actually wrote.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 512,
    });

    const analysis = completion.choices[0]?.message?.content?.trim() || '';
    
    console.log(`✅ AI Analysis generated: "${analysis}"\n`);
    
    if (!analysis || analysis.length < 20) {
      throw new Error('Empty or too short analysis');
    }
    
    return analysis;

  } catch (error) {
    console.error('❌ Groq Error (using contextual fallback):', error.message);
    return generateContextualFallback(question, answer);
  }
};

// Smart fallback based on answer characteristics
function generateContextualFallback(question, answer) {
  const wordCount = answer.trim().split(/\s+/).length;
  const lowerAnswer = answer.toLowerCase();
  
  const hasExample = /example|instance|time when|situation|project|experience with/.test(lowerAnswer);
  const hasNumbers = /\d+%|\d+ years?|\d+ months?|\d+k|\$\d+|increased|decreased|improved|reduced/.test(lowerAnswer);
  const hasExperience = /worked on|built|developed|implemented|led|managed|created|designed/.test(lowerAnswer);
  const hasTechnical = /using|with|tool|framework|language|technology|system|platform|api/.test(lowerAnswer);
  
  const isAboutExperience = /experience|background|worked|previous|past|history/.test(question.toLowerCase());
  const isAboutApproach = /approach|handle|deal with|manage|process|method|strategy/.test(question.toLowerCase());
  const isAboutSkill = /skill|ability|proficient|knowledge|expertise/.test(question.toLowerCase());
  
  if (wordCount < 10) {
    return `Your response is too brief (${wordCount} words). Expand using the STAR method: describe the Situation, your Task, the Action you took, and the Result. Aim for 30-50 words minimum with a specific example.`;
  }
  
  if (wordCount < 30) {
    if (!hasExample && !hasExperience) {
      const noExampleResponses = [
        `You've provided a short answer (${wordCount} words) but it lacks a concrete example. Can you describe a specific time when you ${isAboutApproach ? 'used this approach' : isAboutExperience ? 'had this experience' : 'demonstrated this skill'}? Include what happened and what you achieved.`,
        `This is too general for ${wordCount} words. Interviewers want specifics: tell me about one real ${isAboutExperience ? 'project you worked on' : 'situation you faced'}, your exact role, and the measurable outcome.`,
        `You've touched on the subject (${wordCount} words) but need to illustrate with a real-world scenario. What specific project or situation demonstrates ${isAboutSkill ? 'this skill' : isAboutApproach ? 'this methodology' : 'your experience'}?`,
        `This response needs grounding in reality. Share when you actually ${isAboutExperience ? 'had this experience' : isAboutApproach ? 'used this approach' : 'applied this'}, what challenges you faced, and how you resolved them.`
      ];
      return noExampleResponses[Math.floor(Math.random() * noExampleResponses.length)];
    } else {
      const expandResponses = [
        `Good foundation (${wordCount} words) showing you understand the topic. Now elaborate: what specific ${hasTechnical ? 'technologies or tools' : 'methods'} did you use? What were the quantifiable results?`,
        `You've made a start by mentioning ${hasExperience ? 'your experience' : 'relevant knowledge'}. Strengthen this by adding details about the context, your specific contributions, and measurable outcomes (e.g., "improved by 25%").`,
        `Decent beginning that shows awareness. To make this compelling, describe the ${isAboutApproach ? 'step-by-step process you follow' : 'specific situation and timeline'}, and include metrics or concrete results.`
      ];
      return expandResponses[Math.floor(Math.random() * expandResponses.length)];
    }
  }
  
  if (wordCount < 80) {
    if (hasExample || hasExperience) {
      if (hasNumbers) {
        const strongResponses = [
          `Excellent answer with concrete metrics! You've shown ${isAboutExperience ? 'real experience' : isAboutApproach ? 'a clear methodology' : 'strong capability'} with quantifiable results. Consider adding what you learned or would do differently next time.`,
          `Strong response (${wordCount} words) - you provided both experience and measurable outcomes. This demonstrates competence well. To perfect it, briefly mention any obstacles you overcame.`,
          `Great job including specific numbers and ${hasExample ? 'examples' : 'experience details'}! This shows both technical ability and results-orientation. One enhancement: describe the broader impact on the team or project.`
        ];
        return strongResponses[Math.floor(Math.random() * strongResponses.length)];
      } else {
        const goodResponses = [
          `Solid response showing relevant ${hasExperience ? 'experience' : 'knowledge'} (${wordCount} words). To elevate this further, add specific metrics (e.g., "reduced time by 40%", "handled 500+ cases") and mention challenges overcome.`,
          `You've provided good detail about ${isAboutApproach ? 'your approach' : isAboutExperience ? 'your experience' : 'this topic'}. Make it even stronger by quantifying the impact and describing specific obstacles you navigated.`,
          `Nice structured answer with practical ${hasExample ? 'examples' : 'experience'}. The missing piece: concrete numbers showing the magnitude or success of your ${isAboutApproach ? 'approach' : 'work'}.`
        ];
        return goodResponses[Math.floor(Math.random() * goodResponses.length)];
      }
    } else {
      const adequateResponses = [
        `Your answer (${wordCount} words) covers the basics. Transform it by adding: a specific situation you faced, the concrete actions you took, and the measurable result. Use the STAR framework.`,
        `This response explains ${isAboutApproach ? 'your approach conceptually' : isAboutExperience ? 'your background' : 'the topic'} but needs a real-world anchor. Share when you actually ${isAboutApproach ? 'applied this' : isAboutExperience ? 'had this experience' : 'used this skill'}.`,
        `You understand the question but the answer feels theoretical. Ground it with a specific example: What project? What was your role? What was the outcome?`
      ];
      return adequateResponses[Math.floor(Math.random() * adequateResponses.length)];
    }
  }
  
  if (wordCount > 150) {
    const verboseResponses = [
      `Very thorough response at ${wordCount} words. While detail is valuable, interviews reward conciseness. Lead with your key point, support with one strong example, then summarize the outcome. Quality over quantity.`,
      `Comprehensive answer (${wordCount} words) showing deep knowledge. Consider: could you convey the same value in 80-100 words? Start with the most impactful point and eliminate redundancy.`,
      `You've provided extensive detail (${wordCount} words). For interviews, aim for focused answers: state your main point immediately, give ONE compelling example with results, avoid repetition.`
    ];
    return verboseResponses[Math.floor(Math.random() * verboseResponses.length)];
  }
  
  if (hasExample && (hasExperience || hasTechnical)) {
    if (hasNumbers) {
      const excellentResponses = [
        `Outstanding answer! You combined ${hasExample ? 'specific examples' : 'experience details'} with quantifiable results (${wordCount} words). This demonstrates both capability and communication skills effectively. This is interview-ready!`,
        `Excellent response structure - you've included real ${hasExperience ? 'experience' : 'examples'}, concrete metrics, and ${hasTechnical ? 'technical details' : 'specific methods'}. This showcases both competence and clear thinking. Well done!`,
        `Perfect answer! At ${wordCount} words, you've hit the sweet spot with: specific situation, your actions, and measurable outcomes. This is exactly what interviewers want to hear.`
      ];
      return excellentResponses[Math.floor(Math.random() * excellentResponses.length)];
    } else {
      const veryGoodResponses = [
        `Strong, well-rounded answer (${wordCount} words) with ${hasExample ? 'concrete examples' : 'relevant experience'} and ${hasTechnical ? 'technical depth' : 'good structure'}. One upgrade: add specific metrics like percentages, timeframes, or scale to quantify your impact.`,
        `Very good response showing ${hasExperience ? 'practical experience' : 'clear understanding'} with ${hasExample ? 'real examples' : 'specific details'}. The enhancement: numbers! "Reduced by X%", "Managed Y users", "Completed in Z weeks" would make this perfect.`,
        `Impressive answer demonstrating ${hasTechnical ? 'technical proficiency' : 'strong capability'} and ${hasExample ? 'real-world application' : 'practical experience'}. To reach excellence, quantify the scope, impact, or improvement you achieved.`
      ];
      return veryGoodResponses[Math.floor(Math.random() * veryGoodResponses.length)];
    }
  }
  
  const genericResponses = [
    `Decent response (${wordCount} words) that addresses the question. To elevate: add a specific example from your ${isAboutExperience ? 'career' : 'work'}, include measurable results, and explain your thought process using STAR method.`,
    `You've covered the topic adequately (${wordCount} words). Make it memorable by: describing a particular situation you handled, your specific actions, and concrete outcomes with numbers.`,
    `Reasonable answer showing ${isAboutApproach ? 'your general approach' : isAboutExperience ? 'awareness of the topic' : 'basic understanding'}. Strengthen with: real scenario, your role, actions taken, and quantified results.`
  ];
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

// Generate interview summary
exports.generateInterviewSummary = async (transcript, duration) => {
  try {
    const prompt = `You are an HR professional creating an interview summary.

Interview Transcript:
${transcript}

Duration: ${duration} minutes

Provide a professional summary with:
1. Overall Performance (2-3 sentences)
2. Key Strengths (3 bullet points)
3. Areas for Improvement (3 bullet points)
4. Recommendation (Hire/Consider/Pass with brief reason)

Be constructive and professional.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content?.trim() || 'Summary generation failed.';

  } catch (error) {
    console.error('❌ Groq Error (using basic summary):', error.message);
    
    return `Interview Summary:

Duration: ${duration} minutes

Overall Performance: The candidate participated in a ${duration}-minute interview session, responding to multiple questions and demonstrating their knowledge and experience.

Key Strengths:
- Engaged throughout the interview process
- Provided responses to all questions
- Demonstrated willingness to participate

Areas for Improvement:
- Consider providing more specific examples
- Include quantifiable results and metrics
- Elaborate on technical implementations

Next Steps: Review the detailed responses and consider scheduling a follow-up discussion if needed.`;
  }
};

// Get AI response during interview
exports.generateAIResponse = async (context, userMessage) => {
  try {
    const prompt = `You are a friendly, professional AI interviewer.

Context: ${context}
Candidate said: "${userMessage}"

Respond naturally in 1-2 sentences. Be encouraging and professional.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 256,
    });

    return completion.choices[0]?.message?.content?.trim() || 'Thank you for sharing that.';

  } catch (error) {
    console.error('❌ Groq Error (using generic response):', error.message);
    
    const responses = [
      "Thank you for sharing that. Let's move on to the next question.",
      "That's an interesting perspective. I appreciate your detailed response.",
      "Great, thank you for that answer. Let's continue with the next question.",
      "I see. Your experience is valuable. Let's proceed to the next topic.",
      "Thank you for elaborating on that point. Moving forward to the next question."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
};