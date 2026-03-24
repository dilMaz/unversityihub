const Note = require("../models/Note");
const User = require("../models/User");
const fs = require("fs");

// seed
exports.seedNotes = async (req, res) => {
  const seedCandidates = [
    {
      title: "Programming Fundamentals - Variables and Control Flow",
      subject: "Programming",
      moduleCode: "IT101",
      category: "Lecture Notes",
      description: "Core concepts with examples for beginners.",
      academicYear: 1,
      semester: 1,
      filePath: "seed",
      downloads: 12,
      uploadSource: "admin",
    },
    {
      title: "Discrete Mathematics Practice Questions",
      subject: "Mathematics",
      moduleCode: "MA102",
      category: "Practice Questions",
      description: "Problem set for logic, sets, and proofs.",
      academicYear: 1,
      semester: 2,
      filePath: "seed",
      downloads: 9,
      uploadSource: "admin",
    },
    {
      title: "Object-Oriented Design Patterns Summary",
      subject: "Software Engineering",
      moduleCode: "SE201",
      category: "Summaries",
      description: "Quick reference for common OOP design patterns.",
      academicYear: 2,
      semester: 1,
      filePath: "seed",
      downloads: 17,
      uploadSource: "admin",
    },
    {
      title: "Database Systems Midterm Paper",
      subject: "Database",
      moduleCode: "DB202",
      category: "Exam Papers",
      description: "Midterm paper with model answers.",
      academicYear: 2,
      semester: 2,
      filePath: "seed",
      downloads: 21,
      uploadSource: "admin",
    },
    {
      title: "Operating Systems Study Guide",
      subject: "Computer Science",
      moduleCode: "CS301",
      category: "Study Guides",
      description: "Process management, memory, and scheduling guide.",
      academicYear: 3,
      semester: 1,
      filePath: "seed",
      downloads: 15,
      uploadSource: "admin",
    },
    {
      title: "Computer Networks Previous Exam",
      subject: "Computer Networks",
      moduleCode: "CN302",
      category: "Previous Exams",
      description: "Past paper collection for revision.",
      academicYear: 3,
      semester: 2,
      filePath: "seed",
      downloads: 13,
      uploadSource: "admin",
    },
    {
      title: "Machine Learning Tutorial Notebook Guide",
      subject: "Artificial Intelligence",
      moduleCode: "AI401",
      category: "Tutorials",
      description: "Step-by-step practical tutorial for ML workflow.",
      academicYear: 4,
      semester: 1,
      filePath: "seed",
      downloads: 24,
      uploadSource: "admin",
    },
    {
      title: "Final Year Project Assignment Brief",
      subject: "Project Management",
      moduleCode: "PM402",
      category: "Assignments",
      description: "Assignment rubric, milestones, and submission format.",
      academicYear: 4,
      semester: 2,
      filePath: "seed",
      downloads: 11,
      uploadSource: "admin",
    },
  ];

  const existing = await Note.find(
    {
      title: { $in: seedCandidates.map((n) => n.title) },
      filePath: "seed",
    },
    "title"
  ).lean();

  const existingTitles = new Set(existing.map((n) => n.title));
  const toInsert = seedCandidates.filter((n) => !existingTitles.has(n.title));

  let inserted = [];
  if (toInsert.length > 0) {
    inserted = await Note.insertMany(toInsert);
  }

  res.json({
    message: "Seed completed",
    insertedCount: inserted.length,
    totalSeedTemplates: seedCandidates.length,
  });
};

// search
exports.searchNotes = async (req, res) => {
  const keyword = req.query.search || "";

  const notes = await Note.find({
    $or: [
      { title:      { $regex: keyword, $options: "i" } },
      { subject:    { $regex: keyword, $options: "i" } },
      { moduleCode: { $regex: keyword, $options: "i" } },
    ],
  });

  res.json(notes);
};

// download
exports.downloadNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.filePath && note.filePath !== "seed" && !fs.existsSync(note.filePath)) {
      return res.status(404).json({ message: "File not found on server. Please re-upload this note." });
    }

    note.downloads += 1;
    await note.save();

    const user = await User.findById(req.user?.id);
    if (user) {
      user.downloads.push(note._id);
      await user.save();
    }

    if (!note.filePath || note.filePath === "seed") {
      return res.json({ downloads: note.downloads, fileUrl: null });
    }

    res.json({ downloads: note.downloads, fileUrl: note.filePath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// top rated
exports.topNotes = async (req, res) => {
  const notes = await Note.find().sort({ downloads: -1 }).limit(5);
  res.json(notes);
};

// 📤 Admin create note
exports.createAdminNote = async (req, res) => {
  try {
    const { title, subject, moduleCode, category, description } = req.body;
    const filePath = req.file ? req.file.path : null;

    if (!title || !subject || !filePath) {
      return res.status(400).json({ message: "Title, subject, and file required" });
    }

    const note = new Note({
      title,
      subject,
      moduleCode: moduleCode || "",
      category: category || "Lecture Notes",
      description: description || "",
      filePath,
      uploadedBy: req.user?.id,
      uploadSource: "admin",
    });

    await note.save();

    res.status(201).json({ message: "Note uploaded successfully", note });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📤 Student create note
exports.createStudentNote = async (req, res) => {
  try {
    const { title, subject, moduleCode, category, description, academicYear, semester } = req.body;
    const filePath = req.file ? req.file.path : null;

    // Validation
    if (!title || !subject || !category || !filePath) {
      return res.status(400).json({ message: "Title, subject, category, and file required" });
    }

    const year = parseInt(academicYear, 10);
    const sem = parseInt(semester, 10);

    if (!year || !sem || year < 1 || year > 4 || sem < 1 || sem > 2) {
      return res.status(400).json({ message: "Academic year (1-4) and semester (1-2) required and valid" });
    }

    const note = new Note({
      title,
      subject,
      moduleCode: moduleCode || "",
      category,
      description: description || "",
      filePath,
      uploadedBy: req.user?.id,
      uploadSource: "student",
      academicYear: year,
      semester: sem,
    });

    await note.save();

    res.status(201).json({
      message: "Note uploaded successfully",
      note,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const { getRecommendations } = require("../utils/recommendationEngine");
const { generateQuizFromNote, formatQuizForPDF } = require("../utils/quizGenerator");
const PDFDocument = require("pdfkit");

// 🤖 RECOMMEND
exports.recommendNotes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("downloads");
    console.log("USER ID:", req.user.id);
    console.log("DOWNLOADS:", user.downloads);

    const data = await getRecommendations(user);
    console.log("CONTENT BASED:", data.contentBased.length);
    console.log("TRENDING:", data.trending.length);
    console.log("RECENT:", data.recent.length);

    res.json(data);
  } catch (err) {
    console.log("RECOMMEND ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// 📝 GENERATE QUIZ (AI-powered)
exports.generateQuiz = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    // Check if quiz already exists
    if (note.quiz && note.quiz.questions && note.quiz.questions.length > 0) {
      return res.json({
        message: "Quiz already generated",
        quiz: note.quiz,
      });
    }

    // Update status to generating
    note.quizStatus = "generating";
    await note.save();

    // For now, use note title + subject as content
    // In production, you'd extract text from the PDF file
    const noteContent = `
Title: ${note.title}
Subject: ${note.subject}
Module Code: ${note.moduleCode || "N/A"}

This note contains important information about ${note.subject}.
Key concepts: Core fundamentals, advanced topics, and practical applications.
`;

    // Generate quiz using Claude AI
    const questions = await generateQuizFromNote(note.title, noteContent);

    // Save quiz to database
    note.quiz = {
      questions: questions,
      generatedAt: new Date(),
      generatedBy: "Claude AI",
    };
    note.quizStatus = "completed";
    await note.save();

    res.json({
      message: "Quiz generated successfully",
      quiz: note.quiz,
    });
  } catch (err) {
    const note = await Note.findById(req.params.id);
    if (note) {
      note.quizStatus = "failed";
      await note.save();
    }
    console.log("QUIZ GENERATION ERROR:", err.message);
    res.status(500).json({ message: `Failed to generate quiz: ${err.message}` });
  }
};

// 📥 DOWNLOAD QUIZ AS PDF
exports.downloadQuizPDF = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (!note.quiz || !note.quiz.questions || note.quiz.questions.length === 0) {
      return res.status(400).json({
        message: "Quiz not generated yet. Generate quiz first.",
      });
    }

    // Generate PDF
    const doc = new PDFDocument();

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Quiz_${note.title.replace(/ /g, "_")}.pdf"`
    );

    // Pipe to response
    doc.pipe(res);

    // Add content
    doc.fontSize(20).text(`Quiz: ${note.title}`, { underline: true });
    doc.fontSize(12).text(`Subject: ${note.subject}\n`, { underline: false });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}\n\n`);

    // Add questions
    note.quiz.questions.forEach((q, idx) => {
      doc.fontSize(12).text(`Question ${idx + 1}: ${q.question}`, {
        underline: true,
      });

      if (q.type === "mcq") {
        doc.fontSize(11);
        q.options.forEach((opt, optIdx) => {
          doc.text(`${String.fromCharCode(65 + optIdx)}) ${opt}`);
        });
      } else {
        doc.fontSize(10).text("[Space for your answer]\n");
      }

      doc.fontSize(10).text("");
    });

    // Add answer key
    doc.addPage().fontSize(16).text("ANSWER KEY", { underline: true });
    doc.fontSize(10).text("");

    note.quiz.questions.forEach((q, idx) => {
      doc.fontSize(11).text(`Question ${idx + 1}:`);
      doc.fontSize(10).text(`Answer: ${q.correctAnswer}`);
      doc.text(`Explanation: ${q.explanation}\n`);
    });

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.log("PDF DOWNLOAD ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// 📊 GET QUIZ STATUS
exports.getQuizStatus = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    res.json({
      quizStatus: note.quizStatus,
      hasQuiz: note.quiz && note.quiz.questions && note.quiz.questions.length > 0,
      quiz: note.quiz || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};