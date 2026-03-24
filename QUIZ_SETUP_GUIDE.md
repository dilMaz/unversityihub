# 📚 AI Quiz Generation Feature - Setup Guide

## Overview
This feature allows students to automatically generate AI-powered quizzes from downloaded notes. The quiz is generated using Claude AI (Anthropic) with a mix of Multiple Choice and Short Answer questions, downloadable as PDF.

---

## ✅ Prerequisites

1. **Node.js** installed
2. **Claude API Key** from https://console.anthropic.com/
3. **MongoDB** running locally or connection string ready

---

## 🚀 Installation Steps

### 1️⃣ Backend Setup

```bash
cd backend
npm install @anthropic-ai/sdk pdfkit
```

### 2️⃣ Environment Configuration

Create/update `.env` file in backend root:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/unihub

# JWT
JWT_SECRET=your-strong-secret-key-here

# Claude API
CLAUDE_API_KEY=sk-ant-... (from https://console.anthropic.com/)

# Server
PORT=5000
NODE_ENV=development
```

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
```

### 4️⃣ Database Initialization

Run the seed endpoint to populate sample notes:

```bash
# Start backend server first
npm start

# In another terminal, hit this endpoint:
curl http://localhost:5000/api/notes/seed
```

---

## 📋 API Endpoints

### Quiz Status Check
```
GET /api/notes/:noteId/quiz/status
Authorization: Bearer {token}

Response:
{
  "quizStatus": "pending|generating|completed|failed",
  "hasQuiz": true/false,
  "quiz": { ... }
}
```

### Generate Quiz (AI-powered)
```
POST /api/notes/:noteId/quiz/generate
Authorization: Bearer {token}
Body: {} (empty)

Response:
{
  "message": "Quiz generated successfully",
  "quiz": {
    "questions": [
      {
        "id": 1,
        "type": "mcq",
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A",
        "explanation": "..."
      },
      ...
    ],
    "generatedAt": "2024-03-24T...",
    "generatedBy": "Claude AI"
  }
}
```

### Download Quiz as PDF
```
GET /api/notes/:noteId/quiz/download
Authorization: Bearer {token}

Response: PDF file download
```

---

## 🎯 Features Explained

### Quiz Generation
- **AI Model**: Claude 3.5 Sonnet
- **Question Mix**: 3 MCQ + 2 Short Answer
- **Processing**: Automatic, triggered on-demand
- **Status Tracking**: pending → generating → completed/failed

### PDF Download
- **Format**: Professional PDF layout
- **Sections**: Questions first, Answer Key at end
- **Metadata**: Note title, subject, generation date

### Database Storage
- Quiz cached in MongoDB Note model
- No re-generation if quiz already exists
- Status tracked for UX feedback

---

## 🔌 Component Usage (Frontend)

### Import QuizSection
```javascript
import QuizSection from "../components/QuizSection";

// In your component
<QuizSection noteId={note._id} />
```

### Features in QuizSection
- ✅ Check if quiz already exists
- ✅ Generate quiz button with loading state
- ✅ Download PDF button
- ✅ Preview questions inline
- ✅ Error handling

---

## 🐛 Troubleshooting

### Issue: "Invalid API Key"
**Solution**: Verify CLAUDE_API_KEY in .env is correct from https://console.anthropic.com/

### Issue: "Quiz generation stuck on 'generating'"
**Solution**: Check backend logs, Claude API may take 10-30 seconds. Increase timeout if needed.

### Issue: PDF download not working
**Solution**: Ensure `pdfkit` is installed: `npm install pdfkit`

### Issue: Quiz not appearing after generation
**Solution**: Hard refresh frontend (Ctrl+Shift+R), check browser console for errors

---

## 📊 Database Model Update

The Note model now includes:

```javascript
{
  title: String,
  subject: String,
  moduleCode: String,
  filePath: String,
  downloads: Number,
  
  // NEW FIELDS
  quizStatus: "pending" | "generating" | "completed" | "failed",
  quiz: {
    questions: [
      {
        id: Number,
        type: "mcq" | "short_answer",
        question: String,
        options: [String],        // MCQ only
        correctAnswer: String,
        explanation: String
      }
    ],
    generatedAt: Date,
    generatedBy: String
  }
}
```

---

## 🔐 Security Considerations

1. ✅ Quiz generation requires authentication
2. ✅ Only authenticated users can download PDFs
3. ✅ API rate limiting recommended (prevent abuse)
4. ✅ Validate note exists before processing

---

## 📈 Next Steps / Enhancements

1. **PDF Customization**: Add logos, themes, branding
2. **Multiple Languages**: Translate quizzes
3. **Quiz Analytics**: Track student performance
4. **Custom Questions**: Allow teachers to edit questions
5. **Difficulty Levels**: Easy/Medium/Hard questions
6. **Interactive Mode**: Online quiz taking in app
7. **Batch Generation**: Generate for multiple notes
8. **Caching**: Store PDFs for faster downloads

---

## 👥 File Uploads (Partner Integration)

Your partner should implement:

**Endpoint**: `POST /api/notes/admin-upload`
- Multipart form data with file
- Extract text from PDF/DOC
- Store in MongoDB with filePath

```javascript
// This is already in noteController.js
exports.createAdminNote = async (req, res) => {
  const { title, subject, moduleCode } = req.body;
  const filePath = req.file ? req.file.path : null;
  
  // Save to database
  const note = new Note({
    title,
    subject,
    moduleCode,
    filePath
  });
  
  await note.save();
};
```

---

## 📞 Support

If you encounter issues:
1. Check backend console for error messages
2. Verify all environment variables are set
3. Ensure MongoDB is running
4. Check Claude API quota/billing

---

## 🎓 Example Flow

1. Student searches/downloads a note
2. Click "📝 Quiz" button on note card
3. Click "Generate Quiz" → AI generates in 10-30 seconds
4. View question preview
5. Click "Download Quiz PDF" → PDF downloads
6. Student prints or solves offline

---

**✨ That's it! Your AI Quiz system is ready!**
