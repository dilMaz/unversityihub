const Note = require("../models/Note");

/**
 * Smart Recommendation Engine
 * ────────────────────────────
 * Strategy 1 — Content-Based  : notes from subjects the user downloaded
 * Strategy 2 — Collaborative  : popular notes the user hasn't seen yet
 * Strategy 3 — Trending       : most downloaded in last 30 days
 * Strategy 4 — Recent         : latest uploads
 */
exports.getRecommendations = async (user) => {
  const downloadedIds = (user.downloads || []).map((n) =>
    n._id ? n._id.toString() : n.toString()
  );

  // ── 🎯 1. CONTENT-BASED ─────────────────────────────────
  let contentBased = [];

  if (user.downloads && user.downloads.length > 0) {
    // Collect all subjects from download history
    const downloadedNotes = user.downloads.filter((n) => n._id); // populated
    const subjectCounts   = {};

    downloadedNotes.forEach((note) => {
      subjectCounts[note.subject] = (subjectCounts[note.subject] || 0) + 1;
    });

    // Sort subjects by frequency (most studied first)
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

  // Fallback: random sample if no history
  if (contentBased.length === 0) {
    contentBased = await Note.aggregate([{ $sample: { size: 8 } }]);
  }

  // ── 🔥 2. TRENDING (last 30 days) ───────────────────────
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let trending = await Note.find({
    updatedAt: { $gte: thirtyDaysAgo },
    _id:       { $nin: downloadedIds },
  })
    .sort({ downloads: -1 })
    .limit(8);

  // Fallback: all-time top downloads
  if (trending.length < 3) {
    trending = await Note.find({ _id: { $nin: downloadedIds } })
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