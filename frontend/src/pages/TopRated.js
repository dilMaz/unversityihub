import { useEffect, useState } from "react";
import axios from "axios";

function TopRated() {
  const [notes, setNotes] = useState([]);

  // 🔥 Fetch Top Notes
  const fetchTopNotes = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/notes/top"
      );
      setNotes(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchTopNotes();
  }, []);

  // 📥 Download WITHOUT reload (better UX)
  const handleDownload = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/notes/${id}/download`
      );

      // 🔥 refresh data without page reload
      fetchTopNotes();

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white",
      }}
    >
      <h2 style={{ textAlign: "center" }}>
        ⭐ Top Rated Notes
      </h2>

      {notes.length === 0 ? (
        <p style={{ textAlign: "center" }}>No notes found</p>
      ) : (
        notes.map((note) => (
          <div
            key={note._id}
            style={{
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              borderRadius: "15px",
              padding: "15px",
              margin: "15px auto",
              width: "300px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
          >
            <h3>{note.title}</h3>
            <p>📚 {note.subject}</p>
            <p>📥 {note.downloads} downloads</p>

            <button
              onClick={() => handleDownload(note._id)}
              style={{
                padding: "8px 12px",
                border: "none",
                borderRadius: "8px",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Download 📥
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default TopRated;