import { useEffect, useState } from "react";
import axios from "axios";

function TopRated() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
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

    fetchTopNotes();
  }, []);

  const handleDownload = async (id) => {
    await axios.put(
      `http://localhost:5000/api/notes/${id}/download`
    );

    // reload
    window.location.reload();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>⭐ Top Rated Notes</h2>

      {notes.map((note) => (
        <div
          key={note._id}
          style={{
            border: "1px solid #ccc",
            margin: "10px",
            padding: "10px",
          }}
        >
          <h3>{note.title}</h3>
          <p>Subject: {note.subject}</p>
          <p>Downloads: {note.downloads}</p>

          <button onClick={() => handleDownload(note._id)}>
            Download 📥
          </button>
        </div>
      ))}
    </div>
  );
}

export default TopRated;