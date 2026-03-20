import { useState } from "react";
import axios from "axios";

function Search() {
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState([]);

  // 🔍 search function
  const handleSearch = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/notes?search=${query}`
      );
      setNotes(res.data);
    } catch (err) {
      console.log(err);
      alert("Search error");
    }
  };

  // 📥 download function
  const handleDownload = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/notes/${id}/download`
      );

      alert("Downloaded 📥");

      // 🔥 refresh search results
      handleSearch();
    } catch (err) {
      console.log(err);
      alert("Download error");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🔍 Search Notes</h2>

      <input
        type="text"
        placeholder="Search notes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "8px", width: "250px" }}
      />

      <button onClick={handleSearch} style={{ marginLeft: "10px" }}>
        Search
      </button>

      <hr />

      {notes.map((note) => (
        <div
          key={note._id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            margin: "10px 0",
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

export default Search;