import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import TopRated from "./pages/TopRated";
import Recommended from "./pages/Recommended";

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/top-rated" element={<TopRated />} />
        <Route path="/recommend" element={<Recommended />} />

      </Routes>
    </Router>
  );
}

export default App;