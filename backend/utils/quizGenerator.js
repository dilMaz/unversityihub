const Anthropic = require("@anthropic-ai/sdk");

const anthropicApiKey =
  process.env.ANTHROPIC_API_KEY ||
  process.env.CLAUDE_API_KEY ||
  process.env.ANTHROPIC_KEY ||
  "";

const client = anthropicApiKey
  ? new Anthropic.Anthropic({ apiKey: anthropicApiKey })
  : null;

const buildFallbackQuiz = (noteTitle, noteContent) => {
  const subjectHint =
    (noteContent.match(/Subject:\s*(.+)/i)?.[1] || "this topic").trim();

  return [
    {
      id: 1,
      type: "mcq",
      question: `What is the primary focus of the note titled "${noteTitle}"?`,
      options: [
        `Core concepts of ${subjectHint}`,
        "Historical background only",
        "Financial reporting standards",
        "Laboratory safety checklist",
      ],
      correctAnswer: `Core concepts of ${subjectHint}`,
      explanation: "The note is intended to explain key ideas and practical understanding of the subject.",
    },
    {
      id: 2,
      type: "mcq",
      question: "Which study approach is best aligned with this kind of academic note?",
      options: [
        "Read once without revision",
        "Summarize key points and practice questions",
        "Memorize headings only",
        "Skip examples and focus on definitions",
      ],
      correctAnswer: "Summarize key points and practice questions",
      explanation: "Active recall and practice improve understanding and exam performance.",
    },
    {
      id: 3,
      type: "mcq",
      question: "What should be done after reading the note to improve retention?",
      options: [
        "Close the note immediately",
        "Create a short recap and self-test",
        "Rely only on passive reading",
        "Avoid discussing with peers",
      ],
      correctAnswer: "Create a short recap and self-test",
      explanation: "Recaps and self-testing strengthen long-term memory.",
    },
    {
      id: 4,
      type: "short_answer",
      question: "Write two key concepts you learned from this note.",
      correctAnswer: "Any two relevant core concepts from the note content.",
      explanation: "This checks understanding of the most important ideas.",
    },
    {
      id: 5,
      type: "short_answer",
      question: "How would you apply one concept from this note in a practical scenario?",
      correctAnswer: "A clear practical example connected to one concept in the note.",
      explanation: "Application-based responses show deeper comprehension.",
    },
  ];
};

/**
 * Generate a quiz from note content using Claude AI
 * @param {string} noteTitle - Title of the note
 * @param {string} noteContent - Content of the note (extracted text)
 * @returns {Promise<Array>} - Array of quiz questions
 */
exports.generateQuizFromNote = async (noteTitle, noteContent) => {
  try {
    if (!client) {
      return buildFallbackQuiz(noteTitle, noteContent);
    }

    // Truncate content if too long (Claude has token limits)
    const truncatedContent = noteContent.substring(0, 3000);

    const prompt = `You are a professional quiz generator for educational materials. 
    
Create exactly 5 quiz questions from the following note:

**Note Title:** ${noteTitle}

**Note Content:**
${truncatedContent}

---

Generate a mix of:
- 3 Multiple Choice Questions (MCQ)
- 2 Short Answer Questions

Return ONLY valid JSON (no markdown, no extra text) in this exact format:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct..."
    },
    {
      "id": 2,
      "type": "short_answer",
      "question": "Question text here?",
      "correctAnswer": "Expected answer or key points",
      "explanation": "Explanation of the answer"
    }
  ]
}

Rules:
1. Questions should be clear and test understanding
2. MCQ should have 4 options
3. Use the exact format above
4. Ensure JSON is valid
5. Focus on key concepts from the note`;

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract the text response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const quizData = JSON.parse(jsonMatch[0]);

    return quizData.questions;
  } catch (error) {
    if (
      String(error.message || "").toLowerCase().includes("authentication") ||
      String(error.message || "").toLowerCase().includes("api key")
    ) {
      return buildFallbackQuiz(noteTitle, noteContent);
    }

    console.error("Quiz generation error:", error.message);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
};

/**
 * Convert quiz to PDF format
 * @param {Array} questions - Quiz questions array
 * @param {string} noteTitle - Title of the note
 * @returns {string} - Formatted text for PDF
 */
exports.formatQuizForPDF = (questions, noteTitle) => {
  let pdfContent = `QUIZ: ${noteTitle}\n`;
  pdfContent += `${"=".repeat(50)}\n\n`;

  questions.forEach((q, idx) => {
    pdfContent += `Question ${idx + 1}: ${q.question}\n`;

    if (q.type === "mcq") {
      q.options.forEach((opt, optIdx) => {
        pdfContent += `${String.fromCharCode(65 + optIdx)}) ${opt}\n`;
      });
    } else {
      pdfContent += `[Space for student answer]\n`;
    }

    pdfContent += `\n`;
  });

  pdfContent += `\n${"=".repeat(50)}\n`;
  pdfContent += `ANSWER KEY\n`;
  pdfContent += `${"=".repeat(50)}\n\n`;

  questions.forEach((q, idx) => {
    pdfContent += `Question ${idx + 1}:\n`;
    pdfContent += `Answer: ${q.correctAnswer}\n`;
    pdfContent += `Explanation: ${q.explanation}\n\n`;
  });

  return pdfContent;
};
