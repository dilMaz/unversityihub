import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/Programs.css"; // reuse styles
import ModuleChat from "../components/ModuleChat";

const ModuleNotes = () => {
  const { moduleCode } = useParams();
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
  }, []);

  // 🔥 FAKE DATA (frontend only)
  const allNotes = [
    {
      moduleCode: "IT1120",
      title: "Intro Programming Notes",
      uploader: "Nethmaka",
      downloads: 120,
      rating: 4.8,
    },
    {
      moduleCode: "IT1120",
      title: "Past Papers",
      uploader: "Kamal",
      downloads: 80,
      rating: 4.5,
    },
    {
      moduleCode: "IT1170",
      title: "Data Structures Guide",
      uploader: "John",
      downloads: 95,
      rating: 4.6,
    },
  ];

  // 🔥 FILTER
  const filteredNotes = allNotes.filter(
    (note) => note.moduleCode === moduleCode
  );

  return (
    <div className="db-wrap module-notes-page">
      <div className="module-header">
        <h1>{moduleCode} Module</h1>
        <p>View notes and discuss with other students</p>
      </div>

      {/* Module Content - Notes and Chat together */}
      <div className="module-content">
        {/* Notes Section */}
        <div className="module-section notes-section">
          <h2 className="section-title">📚 Notes</h2>
          <div className="db-cards">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note, i) => (
                <div key={i} className="db-card c1">
                  <div className="db-card-title">{note.title}</div>
                  <div className="db-card-desc">
                    By {note.uploader}
                  </div>
                  <div className="db-card-desc">
                    ⭐ {note.rating} • {note.downloads} downloads
                  </div>

                  <button className="primary-btn">Download</button>
                </div>
              ))
            ) : (
              <p className="no-content">No notes available for this module</p>
            )}
          </div>
        </div>

        {/* Chat Section - Belongs to this module */}
        <div className="module-section chat-section">
          <h2 className="section-title">💬 {moduleCode} Discussion</h2>
          <ModuleChat moduleCode={moduleCode} currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
};

export default ModuleNotes;