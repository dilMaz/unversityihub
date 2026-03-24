const Note = require("../models/Note");

exports.getRecommendations = async (user) => {
  const downloadedIds = (user.downloads || []).map((n) =>
    n._id ? n._id.toString() : n.toString()
  );

  // ── 🎯 1. CONTENT-BASED ─────────────────────────────────
  let contentBased = [];

  if (user.downloads && user.downloads.length > 0) {
    const downloadedNotes = user.downloads.filter((n) => n._id);
    const subjectCounts   = {};

    downloadedNotes.forEach((note) => {
      subjectCounts[note.subject] = (subjectCounts[note.subject] || 0) + 1;
    });

    const topSubjects = Object.keys(subjectCounts)
      .sort((a, b) => subjectCounts[b] - subjectCounts[a])
      .slice(0, 3);

    if (topSubjects.length > 0) {
      contentBased = await Note.find({
        subject: { $in: topSubjects },
        _id:     { $nin: downloadedIds },
      })
        .sort({ downloads: -1 })
        .limit(8);
    }
  }

  // Fallback
  if (contentBased.length === 0) {
    contentBased = await Note.aggregate([{ $sample: { size: 8 } }]);
  }

  // ── 🔥 2. TRENDING ──────────────────────────────────────
  let trending = await Note.find({
    _id: { $nin: downloadedIds },
  })
    .sort({ downloads: -1 }) // ✅ most downloaded
    .limit(8);

  // Fallback
  if (trending.length < 3) {
    trending = await Note.find()
      .sort({ downloads: -1 })
      .limit(8);
  }

  // ── 🆕 3. RECENT ────────────────────────────────────────
  const recent = await Note.find({ _id: { $nin: downloadedIds } })
    .sort({ createdAt: -1 })
    .limit(8);

  return {
    contentBased,
    trending,
    recent,
  };
};