import React, { useState } from "react";
import { Link } from "react-router-dom";
import programsData from "../data/ProgramsData";
import "../styles/modules.css";

function Modules() {
  const [selectedCategory, setSelectedCategory] = useState("Computing");
  const [selectedSubcategory, setSelectedSubcategory] = useState("Information Technology");
  const [expandedYears, setExpandedYears] = useState({});

  const toggleYear = (year) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const categoryData = programsData.categories[selectedCategory];
  const subcategoryData = categoryData?.subcategories[selectedSubcategory];

  return (
    <div className="modules-root">
      <div className="modules-wrap">
        {/* Header */}
        <div className="modules-header">
          <div className="modules-label">📚 Curriculum</div>
          <h1>Module <span>Structure</span></h1>
          <p>Explore the complete module structure by category</p>
        </div>

        {/* Category Selection */}
        <div className="modules-filters">
          <div className="filter-group">
            <label className="filter-label">🏫 Category</label>
            <select
              className="modules-select"
              value={selectedCategory}
              onChange={(e) => {
                const newCategory = e.target.value;
                setSelectedCategory(newCategory);
                const firstSub = Object.keys(programsData.categories[newCategory].subcategories)[0];
                setSelectedSubcategory(firstSub || "");
              }}
            >
              {Object.keys(programsData.categories).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {categoryData && Object.keys(categoryData.subcategories).length > 0 && (
            <div className="filter-group">
              <label className="filter-label">📚 Subcategory</label>
              <select
                className="modules-select"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
              >
                {Object.keys(categoryData.subcategories).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Module Structure */}
        {subcategoryData && subcategoryData.years && Object.keys(subcategoryData.years).length > 0 ? (
          <div className="modules-structure">
            <h2 className="structure-title">{selectedSubcategory} Curriculum</h2>

            {Object.keys(subcategoryData.years).map((yearNum) => {
              const yearData = subcategoryData.years[yearNum];
              const isExpanded = expandedYears[yearNum];

              return (
                <div key={yearNum} className="year-section">
                  <div
                    className="year-header"
                    onClick={() => toggleYear(yearNum)}
                  >
                    <h3 className="year-title">Year {yearNum}</h3>
                    <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="year-content">
                      {Object.keys(yearData.semesters).map((semNum) => (
                        <div key={semNum} className="semester-section">
                          <h4 className="semester-title">Semester {semNum}</h4>
                          <div className="modules-grid">
                            {yearData.semesters[semNum].map((module, index) => (
                              <Link
                                key={index}
                                to={`/module/${module.code}`}
                                className="module-card-link"
                              >
                                <div className="module-card">
                                  <div className="module-header">
                                    <span className="module-code">{module.code}</span>
                                    <span className="module-credits">({module.credits})</span>
                                  </div>
                                  <h5 className="module-name">{module.name}</h5>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="modules-empty">
            <span>📭</span>
            <p>No modules available for {selectedSubcategory}</p>
            <small>Modules will be added soon</small>
          </div>
        )}
      </div>
    </div>
  );
}

export default Modules;