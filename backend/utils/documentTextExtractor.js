const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const MIN_CONTENT_LENGTH = 120;

const normalizeWhitespace = (text = "") =>
  text
    .replace(/\r/g, "\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();

const resolveAbsoluteNotePath = (filePath) => {
  if (!filePath) return null;

  const normalized = String(filePath).replace(/\\/g, "/").replace(/^\/+/, "");
  const candidates = [];

  if (path.isAbsolute(filePath)) {
    candidates.push(filePath);
  }

  candidates.push(path.resolve(process.cwd(), normalized));
  candidates.push(path.resolve(__dirname, "..", normalized));

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

const extractFromPdf = async (absolutePath) => {
  const buffer = fs.readFileSync(absolutePath);
  const result = await pdfParse(buffer);
  return result?.text || "";
};

const extractFromDocx = async (absolutePath) => {
  const result = await mammoth.extractRawText({ path: absolutePath });
  return result?.value || "";
};

const extractPlainText = (absolutePath) => fs.readFileSync(absolutePath, "utf8");

exports.extractTextFromNoteDocument = async (filePath) => {
  const absolutePath = resolveAbsoluteNotePath(filePath);
  if (!absolutePath) {
    throw new Error("Uploaded document was not found on server");
  }

  const ext = path.extname(absolutePath).toLowerCase();
  let rawText = "";

  if (ext === ".pdf") {
    rawText = await extractFromPdf(absolutePath);
  } else if (ext === ".docx") {
    rawText = await extractFromDocx(absolutePath);
  } else if ([".txt", ".md", ".csv"].includes(ext)) {
    rawText = extractPlainText(absolutePath);
  } else if (ext === ".doc") {
    throw new Error("Legacy .doc files are not supported for quiz generation. Please upload PDF or DOCX");
  } else {
    throw new Error("Unsupported document format for quiz generation");
  }

  const cleaned = normalizeWhitespace(rawText);

  if (cleaned.length < MIN_CONTENT_LENGTH) {
    throw new Error("The uploaded document does not contain enough readable text for quiz generation");
  }

  return cleaned;
};
