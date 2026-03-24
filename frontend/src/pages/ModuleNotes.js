import React from "react";
import { useParams } from "react-router-dom";
import "../styles/Programs.css"; // reuse styles

const ModuleNotes = () => {
  const { moduleCode } = useParams();

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
    <div className="db-wrap">
      <h1>{moduleCode} Notes</h1>

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
          <p>No notes available for this module</p>
        )}
      </div>
    </div>
  );
};

export default ModuleNotes;