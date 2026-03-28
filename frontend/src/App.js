import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import NavBar from "./components/NavBar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP"; // Ensure this file exists in src/pages/
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminUploadNotes from "./pages/AdminUploadNotes";
import AdminComments from "./pages/AdminComments";
import AdminPanel from "./pages/AdminPanel";
import StudentSupport from "./pages/StudentSupport";
import StudentSupportForm from "./pages/StudentSupportForm";
import StudySupport from "./pages/StudySupport";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import TopRated from "./pages/TopRated";
import Recommended from "./pages/Recommended";
import Upload from "./pages/Upload";
import Categories from "./pages/Categories";
import AdminReview from "./pages/AdminReview";
import Programs from "./pages/features/programs/Programs";
import ProgramDetail from "./pages/features/programs/ProgramDetail";
import ModuleNotes from "./pages/ModuleNotes";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole") || "user";

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
}

function App() {
  return (
    <Router>
      <div className="app-shell">
        <NavBar />
        <main className="app-content">
          <Routes>
            {/* HOME */}
            <Route path="/" element={<Home />} />

            {/* AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />

            {/* PROTECTED ROUTES */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/student-support" element={<ProtectedRoute><StudentSupportForm /></ProtectedRoute>} />
            <Route path="/student-support-admin" element={<ProtectedRoute><StudentSupport /></ProtectedRoute>} />
            <Route path="/study-support" element={<ProtectedRoute><StudySupport /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/top-rated" element={<ProtectedRoute><TopRated /></ProtectedRoute>} />
            <Route path="/recommend" element={<ProtectedRoute><Recommended /></ProtectedRoute>} />

            {/* ADMIN ROUTES */}
            <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin-users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin-upload-notes" element={<AdminRoute><AdminUploadNotes /></AdminRoute>} />
            <Route path="/admin-comments" element={<AdminRoute><AdminComments /></AdminRoute>} />
            <Route path="/admin-panel" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="/admin-student-support" element={<AdminRoute><StudentSupport /></AdminRoute>} />
            <Route path="/admin-review" element={<AdminRoute><AdminReview /></AdminRoute>} />

            {/* PROGRAM FLOW */}
            <Route path="/programs" element={<Programs />} />
            <Route path="/programs/:programName" element={<ProgramDetail />} />

            {/* MODULE NOTES */}
            <Route path="/module/:moduleCode" element={<ModuleNotes />} />

            {/* CATCH ALL */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;