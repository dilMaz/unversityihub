# Support System Troubleshooting Guide

## 🔍 Common Issues and Solutions

### Issue 1: Support System Not Showing After Push

#### **Possible Causes:**
1. **Backend server not running**
2. **Database connection issues**
3. **Authentication problems**
4. **Route configuration errors**
5. **CORS issues**

---

## 🛠️ **Step-by-Step Debugging:**

### **Step 1: Check Backend Server**
```bash
# Navigate to backend folder
cd g:\unversityhub\backend

# Start the server
start-server.bat

# Or manually
node app.js
```

**Expected Output:**
```
Server running 🚀
DB connected ✅
Server listening on port 5000
```

### **Step 2: Test Server Connection**
Open browser and visit: `http://localhost:5000/api/test`

**Expected Response:**
```json
{
  "message": "Server is working!",
  "timestamp": "2026-03-25T..."
}
```

### **Step 3: Run Debug Script**
```bash
# In backend folder
debug-support.bat
```

This will test:
- ✅ Server connection
- ✅ Authentication
- ✅ Support endpoints
- ✅ Database operations

### **Step 4: Check Frontend Console**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to `/student-support`
4. Submit a test support request
5. Look for debug messages:
   - 🔍 Submitting support request...
   - 📝 Form data: {...}
   - 🔑 Token exists: true/false
   - 📤 Sending request to: http://localhost:5000/api/support

### **Step 5: Check Backend Console**
Look for these messages:
- 🔍 Support request received: {...}
- 👤 User ID from token: ...
- ✅ Support request created: ...

---

## 🚨 **Error Messages & Solutions:**

### **"Server not running"**
**Solution:** Start backend server with `node app.js`

### **"No token, access denied"**
**Solution:** 
1. Login first to get token
2. Check localStorage for token
3. Token might be expired - login again

### **"Invalid token"**
**Solution:**
1. Clear browser localStorage
2. Login again
3. Check JWT_SECRET in backend

### **"Cannot POST /api/support"**
**Solution:**
1. Check if support routes are registered in app.js
2. Verify server is running on port 5000

### **"Database connection error"**
**Solution:**
1. Check MongoDB is running
2. Verify MONGO_URI in .env file
3. Check database credentials

### **"Support request not found"**
**Solution:**
1. Check SupportRequest model
2. Verify database collection exists
3. Check user ID in token

---

## 🔧 **Quick Fixes:**

### **Fix 1: Reset and Restart**
```bash
# Stop all Node.js processes
# Clear browser cache
# Restart backend server
# Login again
```

### **Fix 2: Check Environment Variables**
Create `.env` file in backend folder:
```
MONGO_URI=mongodb://localhost:27017/unihub
JWT_SECRET=unihub_dev_secret
PORT=5000
```

### **Fix 3: Verify Routes**
In `app.js`, ensure these lines exist:
```javascript
const supportRoutes = require("./routes/supportRoutes");
app.use("/api/support", supportRoutes);
```

### **Fix 4: Check Frontend Routes**
In `App.js`, ensure:
```javascript
<Route path="/student-support" element={<ProtectedRoute><StudentSupport /></ProtectedRoute>} />
```

---

## 📱 **Testing the Support System:**

### **Test 1: Create Support Request**
1. Login to application
2. Navigate to `/student-support`
3. Fill out form with:
   - Title: "Test Support Request"
   - Category: "Technical bug"
   - Priority: "Medium"
   - Description: "This is a test support request"
4. Click "Submit Request"

### **Test 2: Check Admin Panel**
1. Login as admin
2. Navigate to `/admin-student-support`
3. Verify the request appears

### **Test 3: Check Database**
```javascript
// In MongoDB shell
use unihub
db.supportrequests.find().pretty()
```

---

## 🎯 **Final Verification:**

If all steps pass, the support system should work:
- ✅ Backend server running
- ✅ Database connected
- ✅ Authentication working
- ✅ Support requests creating
- ✅ Frontend displaying properly

**Still not working? Check the console logs for specific error messages!**
