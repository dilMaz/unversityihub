import { useEffect, useState } from "react";
import axios from "axios";

function Recommended() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/notes/recommend",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setNotes(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchRecommended();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🤖 Recommended Notes</h2>

      {notes.length === 0 && <p>No recommendations yet 😅</p>}

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
        </div>
      ))}
    </div>
  );
}

export default Recommended;