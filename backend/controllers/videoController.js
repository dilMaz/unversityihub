const VideoResource = require("../models/VideoResource");
const { VIDEO_CATEGORIES } = require("../models/VideoResource");

const VALID_YEARS = [1, 2, 3, 4];
const VALID_SEMESTERS = [1, 2];
const MODULE_NAME_REGEX = /^[A-Za-z\s]+$/;

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
      .sort({ createdAt: -1 })
      .lean();

    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllVideos = async (_req, res) => {
  try {
    const videos = await VideoResource.find()
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
