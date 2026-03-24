import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const QuizSection = ({ noteId }) => {
  const [quizStatus, setQuizStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");

  // Check quiz status on mount
  const checkQuizStatus = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/notes/${noteId}/quiz/status`
      );
      setQuizStatus(res.data.quizStatus);
      setQuiz(res.data.quiz);
    } catch (err) {
      console.error("Failed to check quiz status:", err);
    }
  }, [noteId]);

  useEffect(() => {
    checkQuizStatus();
  }, [checkQuizStatus, noteId]);

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:5000/api/notes/${noteId}/quiz/generate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuiz(res.data.quiz);
      setQuizStatus("completed");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate quiz");
      setQuizStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/notes/${noteId}/quiz/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `quiz_${noteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      console.error("Failed to download quiz:", err);
      alert("Failed to download quiz");
    }
  };

  return (
    <div className="quiz-section">
      <div className="quiz-header">
        <span className="quiz-icon">📝</span>
        <h3>Quiz</h3>
      </div>

      {error && <div className="quiz-error">{error}</div>}

      {quizStatus === "pending" && (
        <button
          className="quiz-generate-btn"
          onClick={handleGenerateQuiz}
          disabled={loading}
        >
          {loading ? "🔄 Generating..." : "📝 Generate Quiz"}
        </button>
      )}

      {quizStatus === "generating" && (
        <div className="quiz-generating">
          <span className="spinner">⏳</span>
          <p>Generating quiz...</p>
        </div>
      )}

      {quizStatus === "completed" && quiz && (
        <div className="quiz-completed">
          <p className="quiz-info">
            Quiz ready with {quiz.questions.length} questions
          </p>
          <button
            className="quiz-download-btn"
            onClick={handleDownloadQuiz}
          >
            📥 Download Quiz PDF
          </button>
          <div className="quiz-preview">
            <details>
              <summary>Preview Questions</summary>
              <div className="quiz-preview-list">
                {quiz.questions.map((q, idx) => (
                  <div key={idx} className="quiz-preview-item">
                    <strong>Q{idx + 1}:</strong> {q.question}
                    <br />
                    <em>Type: {q.type === "mcq" ? "Multiple Choice" : "Short Answer"}</em>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}

      {quizStatus === "failed" && (
        <button
          className="quiz-generate-btn"
          onClick={handleGenerateQuiz}
          disabled={loading}
        >
          {loading ? "🔄 Retrying..." : "🔄 Retry Generation"}
        </button>
      )}

      <style jsx>{`
        .quiz-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          color: white;
        }

        .quiz-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .quiz-icon {
          font-size: 24px;
        }

        .quiz-header h3 {
          margin: 0;
          color: white;
        }

        .quiz-error {
          background: rgba(255, 0, 0, 0.2);
          border: 1px solid #ff6b6b;
          color: #ffe0e0;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .quiz-generate-btn,
        .quiz-download-btn {
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }

        .quiz-generate-btn:hover:not(:disabled),
        .quiz-download-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .quiz-generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .quiz-generating {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
        }

        .spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .quiz-completed {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 15px;
        }

        .quiz-info {
          margin: 0 0 15px 0;
          color: #f0f0f0;
        }

        .quiz-preview {
          margin-top: 15px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          overflow: hidden;
        }

        .quiz-preview summary {
          padding: 10px;
          cursor: pointer;
          user-select: none;
          font-weight: 600;
        }

        .quiz-preview-list {
          padding: 10px 15px;
          background: rgba(0, 0, 0, 0.15);
        }

        .quiz-preview-item {
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 13px;
          line-height: 1.4;
        }

        .quiz-preview-item:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};

export default QuizSection;
