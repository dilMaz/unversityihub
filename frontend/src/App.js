import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminUploadNotes from "./pages/AdminUploadNotes";
import AdminComments from "./pages/AdminComments";
import AdminPanel from "./pages/AdminPanel";
import StudentSupport from "./pages/StudentSupport";
import Search from "./pages/Search";
import TopRated from "./pages/TopRated";
import Recommended from "./pages/Recommended";
import AdminReview from "./pages/AdminReview";

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-users" element={<AdminUsers />} />
        <Route path="/admin-upload-notes" element={<AdminUploadNotes />} />
        <Route path="/admin-comments" element={<AdminComments />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/admin-student-support" element={<StudentSupport />} />
        <Route path="/search" element={<Search />} />
        <Route path="/top-rated" element={<TopRated />} />
        <Route path="/recommend" element={<Recommended />} />
        <Route path="/admin-review" element={<AdminReview />} /> 

      </Routes>
    </Router>
  );
}

export default App;