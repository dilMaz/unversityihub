import React from "react";
import { useNavigate } from "react-router-dom";

const Programs = () => {
  const navigate = useNavigate();

  return (
    <div className="db-wrap">
      <h1>Computing Programs</h1>

      <div className="db-cards">
        <div
          className="db-card c1"
          onClick={() => navigate("/programs/information-technology")}
        >
          <div className="db-card-title">Information Technology</div>
          <div className="db-card-desc">
            Explore IT modules and notes.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Programs;