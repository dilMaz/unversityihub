const Note = require("../models/Note");
const User = require("../models/User");
const fs = require("fs");

const approvedOrLegacyFilter = { $in: ["approved", null] };

const isAdminRequest = (req) => req.user?.role === "admin";

const canAccessNote = (req, note) => {
  if (note?.moderationStatus === "approved" || !note?.moderationStatus) {
    return true;
  }

  return isAdminRequest(req);
};

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
    moderationStatus: approvedOrLegacyFilter,
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

    if (!canAccessNote(req, note)) {
      return res.status(403).json({ message: "This note is not available for users" });
    }

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
  const notes = await Note.find({ moderationStatus: approvedOrLegacyFilter })
    .sort({ downloads: -1 })
    .limit(5);
  res.json(notes);
};

// 👀 View online
exports.viewNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (!canAccessNote(req, note)) {
      return res.status(403).json({ message: "This note is not available for users" });
    }

    if (!note.filePath || note.filePath === "seed") {
      return res.status(404).json({ message: "This note has no viewable file" });
    }

    if (!fs.existsSync(note.filePath)) {
      return res.status(404).json({ message: "File not found on server. Please re-upload this note." });
    }

    res.json({ fileUrl: note.filePath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const ensureAdmin = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Admin only" });
    return false;
  }
  return true;
};

const recalculateRating = (note) => {
  const comments = Array.isArray(note.comments) ? note.comments : [];
  const ratingCount = comments.length;
  const averageRating = ratingCount
    ? comments.reduce((sum, c) => sum + (Number(c.rating) || 0), 0) / ratingCount
    : 0;

  note.ratingCount = ratingCount;
  note.averageRating = Number(averageRating.toFixed(2));
};

// 🧾 Admin moderation routes
exports.getPendingReviewNotes = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const notes = await Note.find({ moderationStatus: "pending" })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReviewedNotes = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const notes = await Note.find({ moderationStatus: { $in: ["approved", "rejected"] } })
      .populate("uploadedBy", "name email")
      .populate("reviewedBy", "name email")
      .sort({ reviewedAt: -1, updatedAt: -1 });

    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveNote = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    note.moderationStatus = "approved";
    note.reviewedBy = req.user.id;
    note.reviewedAt = new Date();
    note.reviewComment = "";
    await note.save();

    res.json({ message: "Note approved", note });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectNote = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    note.moderationStatus = "rejected";
    note.reviewedBy = req.user.id;
    note.reviewedAt = new Date();
    note.reviewComment = (req.body?.comment || "").toString().slice(0, 300);
    await note.save();

    res.json({ message: "Note rejected", note });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteReviewedNote = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (!["approved", "rejected"].includes(note.moderationStatus)) {
      return res.status(400).json({ message: "Only approved or rejected notes can be deleted" });
    }

    if (note.filePath && note.filePath !== "seed" && fs.existsSync(note.filePath)) {
      fs.unlinkSync(note.filePath);
    }

    await note.deleteOne();
    res.json({ message: "Document deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 💬 Comments
exports.getNoteComments = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate("comments.user", "name email")
      .select("comments");

    if (!note) return res.status(404).json({ message: "Note not found" });

    const comments = [...(note.comments || [])].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addNoteComment = async (req, res) => {
  try {
    const text = (req.body?.text || "").trim();
    const parsedRating = Number(req.body?.rating);
    const rating = Number.isFinite(parsedRating) ? Math.max(1, Math.min(5, Math.round(parsedRating))) : 3;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    note.comments.push({
      user: req.user.id,
      rating,
      text: text.slice(0, 500),
      createdAt: new Date(),
    });

    recalculateRating(note);
    await note.save();

    res.status(201).json({ message: "Comment added" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateNoteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const comment = note.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isAdmin = req.user?.role === "admin";
    const isOwner = String(comment.user) === String(req.user?.id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    const nextText = (req.body?.text ?? comment.text).toString().trim();
    if (!nextText) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    comment.text = nextText.slice(0, 500);

    if (req.body?.rating !== undefined) {
      const parsedRating = Number(req.body.rating);
      if (Number.isFinite(parsedRating)) {
        comment.rating = Math.max(1, Math.min(5, Math.round(parsedRating)));
      }
    }

    recalculateRating(note);
    await note.save();

    res.json({ message: "Comment updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 💬 Admin comments management
exports.getAllCommentsByNoteForAdmin = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const notes = await Note.find({ "comments.0": { $exists: true } })
      .populate("comments.user", "name email")
      .select("title subject moduleCode comments averageRating ratingCount")
      .sort({ updatedAt: -1 });

    const payload = notes.map((note) => ({
      _id: note._id,
      title: note.title,
      subject: note.subject,
      moduleCode: note.moduleCode,
      averageRating: note.averageRating || 0,
      ratingCount: note.ratingCount || (note.comments || []).length,
      commentsCount: (note.comments || []).length,
      comments: [...(note.comments || [])].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    }));

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteNoteCommentByAdmin = async (req, res) => {
  try {
    const { noteId, commentId } = req.params;
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const comment = note.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner = String(comment.user) === String(req.user?.id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    comment.deleteOne();

    recalculateRating(note);
    await note.save();

    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
      moderationStatus: "approved",
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
      moderationStatus: "pending",
    });

    await note.save();

    res.status(201).json({
      message: "Note uploaded successfully and is pending admin approval",
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