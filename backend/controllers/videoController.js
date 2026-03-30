const VideoResource = require("../models/VideoResource");
const { VIDEO_CATEGORIES } = require("../models/VideoResource");

const VALID_YEARS = [1, 2, 3, 4];
const VALID_SEMESTERS = [1, 2];
const MODULE_NAME_REGEX = /^[A-Za-z\s]+$/;
const VALID_REACTIONS = ["good", "bad"];

const buildReactionCounts = (reactions = []) => {
  return reactions.reduce(
    (acc, item) => {
      if (item?.type === "good") acc.good += 1;
      if (item?.type === "bad") acc.bad += 1;
      return acc;
    },
    { good: 0, bad: 0 }
  );
};

exports.createAdminVideo = async (req, res) => {
  try {
    const {
      title,
      category,
      academicYear,
      semester,
      moduleCode,
      moduleName,
      description,
    } = req.body;

    if (!title || !category || !academicYear || !semester || !moduleCode) {
      return res.status(400).json({
        message: "Title, category, academic year, semester, and module code are required",
      });
    }

    if (!VIDEO_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid video category" });
    }

    const year = Number(academicYear);
    const sem = Number(semester);

    if (!VALID_YEARS.includes(year)) {
      return res.status(400).json({ message: "Academic year must be between 1 and 4" });
    }

    if (!VALID_SEMESTERS.includes(sem)) {
      return res.status(400).json({ message: "Semester must be 1 or 2" });
    }

    const moduleNameValue = moduleName ? String(moduleName).trim() : "";
    if (moduleNameValue && !MODULE_NAME_REGEX.test(moduleNameValue)) {
      return res.status(400).json({ message: "Module name must contain letters only" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Video file is required" });
    }

    const doc = await VideoResource.create({
      title: String(title).trim(),
      category,
      academicYear: year,
      semester: sem,
      moduleCode: String(moduleCode).trim().toUpperCase(),
      moduleName: moduleNameValue,
      description: description ? String(description).trim() : "",
      videoPath: req.file.path.replace(/\\/g, "/"),
      uploadedBy: req.user.id,
    });

    res.status(201).json({ message: "Video uploaded successfully", video: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllAdminVideos = async (req, res) => {
  try {
    const videos = await VideoResource.find()
      .populate("uploadedBy", "name email")
      .populate("reactions.user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllVideos = async (req, res) => {
  try {
    const currentUserId = String(req.user?.id || req.user?._id || "");
    const videos = await VideoResource.find()
      .populate("uploadedBy", "name email")
      .populate("reactions.user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const payload = videos.map((video) => {
      const reactions = Array.isArray(video.reactions) ? video.reactions : [];
      const currentUserReaction = reactions.find((item) => {
        const reactionUserId = String(item?.user?._id || item?.user || "");
        return reactionUserId && reactionUserId === currentUserId;
      })?.type || "";

      return {
        ...video,
        reactionCounts: buildReactionCounts(reactions),
        currentUserReaction,
      };
    });

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addOrUpdateReaction = async (req, res) => {
  try {
    const videoId = req.params.id;
    const reactionType = String(req.body?.reaction || "").trim().toLowerCase();

    if (!VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({ message: "Reaction must be good or bad" });
    }

    const video = await VideoResource.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const currentUserId = String(req.user?.id || req.user?._id || "");
    const existing = video.reactions.find((item) => String(item.user) === currentUserId);

    if (existing) {
      existing.type = reactionType;
      existing.createdAt = new Date();
    } else {
      video.reactions.push({
        user: currentUserId,
        type: reactionType,
      });
    }

    await video.save();

    const updated = await VideoResource.findById(videoId).lean();
    const reactionCounts = buildReactionCounts(updated?.reactions || []);

    return res.json({
      message: "Reaction saved",
      reactionCounts,
      currentUserReaction: reactionType,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteAdminVideo = async (req, res) => {
  try {
    const video = await VideoResource.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    await VideoResource.findByIdAndDelete(req.params.id);
    res.json({ message: "Video deleted", deletedVideoId: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
