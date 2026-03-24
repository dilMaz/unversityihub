# 🚀 IMMEDIATE SETUP - Do This Now!

## Step 1: Get Claude API Key (2 min)
```
1. Go to: https://console.anthropic.com/
2. Sign up / Login
3. Click "API Keys" 
4. Create new API key
5. Copy the key (starts with sk-ant-...)
6. Keep it safe - you'll need it in Step 3
```

## Step 2: Install Backend Dependencies (1 min)
```bash
# Open Terminal in VS Code
cd backend
npm install @anthropic-ai/sdk pdfkit
```

Press Enter and wait for installation to complete.

## Step 3: Add Environment Variables (1 min)

Create/Update `backend/.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/unihub
JWT_SECRET=your-secret-key-12345
CLAUDE_API_KEY=sk-ant-paste-your-key-here
PORT=5000
NODE_ENV=development
```

## Step 4: Start Backend Server

```bash
# In backend folder
npm start
```

You should see: `API Running 🚀`

## Step 5: Start Frontend Server (New Terminal)

```bash
cd frontend
npm start
```

Browser should open to `http://localhost:3000`

## Step 6: Test the Feature (5 min)

### 6a. Seed Sample Notes
```
GET http://localhost:5000/api/notes/seed
```

### 6b. Login
- Go to http://localhost:3000/login
- Register a new account (any email/password)
- Login

### 6c. Go to Search
- Click "Search Notes" card
- Search for "Java" or "Database"
- Click "Quiz 📝" button
- Click "📝 Generate Quiz"
- Wait 10-30 seconds...
- Click "📥 Download Quiz PDF"
- Check Downloads folder ✅

---

## ✅ Success Checklist

- [ ] Claude API key obtained
- [ ] @anthropic-ai/sdk installed
- [ ] pdfkit installed
- [ ] .env file created with CLAUDE_API_KEY
- [ ] Backend running (npm start)
- [ ] Frontend running (npm start)
- [ ] Can login to app
- [ ] Can generate quiz from note
- [ ] Can download PDF
- [ ] PDF opens successfully

---

## 🐛 If Something Goes Wrong

### Backend won't start?
```bash
# Check if port 5000 is in use
# Kill process on port 5000 or change PORT in .env
```

### npm install fails?
```bash
# Delete node_modules and package-lock.json
rm -r node_modules package-lock.json
npm install
```

### "Invalid API Key" error?
```
1. Double-check your key in .env
2. Verify it starts with "sk-ant-"
3. Check https://console.anthropic.com/ for valid keys
```

### Quiz generation not working?
```
1. Check backend console for errors
2. Verify MongoDB is running
3. Check browser DevTools (F12) > Console for errors
4. Verify note was found (search works)
```

---

## 📁 All Files Ready

These files have been created/updated for you:

✅ `backend/utils/quizGenerator.js` - AI quiz engine
✅ `backend/controllers/noteController.js` - Quiz endpoints  
✅ `backend/routes/noteRoutes.js` - Quiz routes
✅ `backend/models/Note.js` - Quiz database fields
✅ `frontend/src/components/QuizSection.js` - Quiz UI
✅ `frontend/src/pages/Search.js` - Search with quiz
✅ `frontend/src/pages/TopRated.js` - Top rated with quiz
✅ `frontend/src/pages/Recommended.js` - Recommended with quiz
✅ `QUIZ_SETUP_GUIDE.md` - Detailed guide
✅ `QUICK_REFERENCE.md` - Copy-paste snippets
✅ `IMPLEMENTATION_SUMMARY.md` - Complete overview

---

## 🎯 Feature Complete!

Your students can now:
1. ✅ Download notes
2. ✅ Generate AI quiz from note (3 MCQ + 2 Short Answer)
3. ✅ Download quiz as PDF
4. ✅ Review questions + answer key

---

## ❓ Common Questions

**Q: Why is generation taking 10-30 seconds?**
A: Claude API latency. Normal and expected. Subsequent downloads use cached quiz.

**Q: Can students modify questions?**
A: Not in this version. Teachers can edit in future version.

**Q: What if note has no text?**
A: Generation works with note title + subject field (already populated).

**Q: Can we bulk generate for all notes?**
A: Not implemented yet. Can add in Phase 2.

**Q: Does it work on mobile?**
A: Yes! All components are responsive.

---

## 🚀 You're All Set!

Follow Steps 1-6 above and you're done! 

If you have questions or your partner needs to integrate their upload feature, check:
- `QUIZ_SETUP_GUIDE.md` for detailed explanations
- `QUICK_REFERENCE.md` for code snippets
- `IMPLEMENTATION_SUMMARY.md` for full overview

**Happy studying! 📚✨**

---

## 📞 Quick Support

Need help? Check:
1. Backend console for errors
2. Browser DevTools (F12) for frontend errors
3. .env file for missing keys
4. MongoDB connection

All files are documented with comments.
