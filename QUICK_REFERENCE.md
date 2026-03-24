# 🚀 Quick Reference - Copy/Paste Code Snippets

## Backend Installation Commands

```bash
# Navigate to backend
cd backend

# Install required packages
npm install @anthropic-ai/sdk pdfkit

# Test if everything works
npm start
```

## Environment Variables (.env)

```bash
# ================================================================
# Copy this entire block to your backend/.env file
# ================================================================

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/unihub
DB_NAME=unihub

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=1d

# Claude AI Configuration
CLAUDE_API_KEY=sk-ant-put-your-api-key-here
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
UPLOAD_PATH=uploads/notes/
MAX_FILE_SIZE=52428800

# ================================================================
```

## Get Claude API Key

1. Go to https://console.anthropic.com/
2. Sign up or login
3. Go to "API Keys" section
4. Create new API key
5. Copy and paste to `.env` file

## Test Quiz Generation (via cURL)

```bash
# 1. Get a note ID first
curl http://localhost:5000/api/notes/seed

# Note the _id of any note (e.g., "123abc...")

# 2. Get quiz status
curl http://localhost:5000/api/notes/123abc.../quiz/status

# 3. Generate quiz (replace TOKEN and NOTE_ID)
curl -X POST http://localhost:5000/api/notes/NOTE_ID/quiz/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# 4. Download PDF
curl -X GET http://localhost:5000/api/notes/NOTE_ID/quiz/download \
  -H "Authorization: Bearer TOKEN" \
  -o quiz.pdf
```

## Files Created/Modified

```
✅ CREATED:
  - backend/utils/quizGenerator.js
  - backend/controllers/noteController.js (added 3 functions)
  - frontend/src/components/QuizSection.js
  - QUIZ_SETUP_GUIDE.md
  - QUICK_REFERENCE.md (this file)

✏️ MODIFIED:
  - backend/models/Note.js (added quiz fields)
  - backend/routes/noteRoutes.js (added 3 quiz routes)
  - frontend/src/pages/Search.js (integrated QuizSection)
```

## Database Schema Update

If you're updating existing database:

```bash
# Connect to MongoDB
mongo unihub

# Run this to add quiz fields to existing notes:
db.notes.updateMany(
  {},
  {
    $set: {
      quizStatus: "pending",
      quiz: {
        questions: [],
        generatedAt: null,
        generatedBy: null
      }
    }
  }
)
```

## React Component Integration

Use in any React page:

```javascript
import QuizSection from "../components/QuizSection";

function MyPage({ noteId }) {
  return (
    <div>
      <h1>My Note</h1>
      
      {/* Add this line wherever you want quiz */}
      <QuizSection noteId={noteId} />
    </div>
  );
}

export default MyPage;
```

## API Response Examples

### Success Response - Generate Quiz
```json
{
  "message": "Quiz generated successfully",
  "quiz": {
    "questions": [
      {
        "id": 1,
        "type": "mcq",
        "question": "What is the primary purpose of a database index?",
        "options": [
          "To store backup data",
          "To speed up query performance",
          "To encrypt sensitive data",
          "To limit user access"
        ],
        "correctAnswer": "To speed up query performance",
        "explanation": "Database indexes are used to speed up query performance by allowing the database to find data without scanning every row."
      },
      {
        "id": 2,
        "type": "short_answer",
        "question": "Explain the ACID properties in database transactions.",
        "correctAnswer": "Atomicity, Consistency, Isolation, Durability - properties ensuring reliable transactions",
        "explanation": "ACID ensures transactions are reliable: Atomicity (all or nothing), Consistency (valid state), Isolation (independent), Durability (permanent)."
      }
    ],
    "generatedAt": "2024-03-24T10:30:00.000Z",
    "generatedBy": "Claude AI"
  }
}
```

### Error Response
```json
{
  "message": "Failed to generate quiz: Invalid API key"
}
```

## Debugging Tips

### Check Backend Logs
```bash
# Terminal showing backend server
npm start

# Should show:
# > unihub@1.0.0 start
# > node app.js
# API Running 🚀
```

### Check Frontend Logs
```bash
# Open DevTools (F12)
# Go to Console tab
# Should see successful API calls and responses
```

### Test Each Endpoint Individually

```bash
# 1. Is backend running?
curl http://localhost:5000/

# 2. Can you get notes?
curl http://localhost:5000/api/notes/seed

# 3. Is authentication working?
# First login to get token, then:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/notes/NOTEID/quiz/status
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module '@anthropic-ai/sdk'" | Run `npm install @anthropic-ai/sdk` |
| "Invalid API Key" | Check CLAUDE_API_KEY in .env file |
| "Quiz stuck on generating" | Check backend logs, API may be slow |
| "Download PDF returns 404" | Ensure note ID is correct, quiz exists |
| "CORS error" | Check CORS_ORIGIN in .env matches frontend URL |
| "Database error" | Verify MongoDB is running, connection string is correct |

## Next Integration Points

Once quiz is working, you can:

1. **Add to TopRated component**
   ```javascript
   import QuizSection from "../components/QuizSection";
   // Add: <QuizSection noteId={note._id} />
   ```

2. **Add to Recommended component**
   ```javascript
   import QuizSection from "../components/QuizSection";
   // Add: <QuizSection noteId={note._id} />
   ```

3. **Create Quiz Page**
   ```javascript
   // pages/QuizTaker.js - for interactive online quizzes
   ```

4. **Add Quiz Analytics**
   ```javascript
   // Track which quizzes students use most
   ```

## Performance Tips

- Quiz generation takes 10-30 seconds (API latency)
- Cache generated quizzes in database ✅ (already done)
- Consider rate limiting: 1 quiz per note per 5 minutes
- Store PDFs if high traffic expected

---

**Happy Quizzing! 🎓**
