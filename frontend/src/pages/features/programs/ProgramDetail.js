import React, { useState } from "react";
import { useParams } from "react-router-dom";
import programsData from "../../../data/ProgramsData";
import { useNavigate } from "react-router-dom";

const ProgramDetail = () => {

  const navigate = useNavigate();

  
  const { programName } = useParams();
  const program = programsData[programName];

  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");

  if (!program) return <div>Program not found</div>;

  return (
    <div className="db-wrap">
      <h1>{program.name}</h1>

      {/* Year */}
      <select
        value={year}
        onChange={(e) => {
          setYear(e.target.value);
          setSemester("");
        }}
      >
        <option value="">Select Year</option>
        {Object.keys(program.years).map((y) => (
          <option key={y}>{y}</option>
        ))}
      </select>

      {/* Semester */}
      {year && (
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option value="">Select Semester</option>
          {Object.keys(program.years[year]).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      )}

      {/* Modules */}
      {semester && (
        <div className="db-cards">
          {program.years[year][semester].map((m, i) => (
  <div
    key={i}
    className="db-card c2"
    onClick={() => navigate(`/module/${m.code}`)}
  >
    <div className="db-card-title">
      {m.code} - {m.name}
    </div>
    <div className="db-card-desc">
      Credits: {m.credits}
    </div>
  </div>
))}
        </div>
      )}
    </div>
  );
};




export default ProgramDetail;