import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/supportForm.css";

function StudentSupport() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    category: "Technical bug",
    priority: "medium",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const categories = [
    { value: "Account issue", label: "Account Issue" },
    { value: "Wrong note / low quality note", label: "Wrong note / low quality note" },
    { value: "Upload problem", label: "Upload Problem" },
    { value: "Download problem", label: "Download Problem" },
    { value: "Report fake user", label: "Report Fake User" },
    { value: "Technical bug", label: "Technical Bug" },
    { value: "Other academic support", label: "Other Academic Support" },
  ];

  const priorities = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      console.log('🔍 Submitting support request...');
      console.log('📝 Form data:', formData);
      console.log('🔑 Token exists:', !!token);

      const payload = {
        title: formData.title,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
      };

      console.log('📤 Sending request to: http://localhost:5000/api/support');
      console.log('📦 Payload:', payload);

      const res = await axios.post(
        "http://localhost:5000/api/support",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log('✅ Support request submitted:', res.data);
      setSuccess(true);
      // Reset form
      setFormData({
        title: "",
        category: "Technical bug",
        priority: "medium",
        description: "",
      });
    } catch (err) {
      console.error('❌ Support request error:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      setError(err?.response?.data?.message || "Failed to submit support request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate("/dashboard");
  };

  if (success) {
    return (
      <div className="support-page-wrapper">
        <div className="support-success-container">
          <div className="support-success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2>Support Request Submitted!</h2>
          <p>Thank you for contacting us. Your support request has been successfully submitted and our team will get back to you soon.</p>
          <div className="support-success-actions">
            <button className="support-btn support-btn-primary" onClick={goBack}>
              Back to Dashboard
            </button>
            <button className="support-btn support-btn-secondary" onClick={() => setSuccess(false)}>
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="support-page-wrapper">
      <div className="support-page-header">
        <button className="support-back-btn" onClick={goBack}>
          ← Back to Dashboard
        </button>
        <h1>Student Support</h1>
        <p>We're here to help! Fill out the form below and we'll get back to you as soon as possible.</p>
      </div>

      <div className="support-form-container">
        <form onSubmit={handleSubmit} className="support-form">
          {error && (
            <div className="support-error">
              {error}
            </div>
          )}

          <div className="support-form-grid">
            <div className="support-field support-field-full">
              <label htmlFor="title" className="support-label">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="support-input"
                placeholder="Brief description of your issue"
                required
                disabled={loading}
              />
            </div>

            <div className="support-field">
              <label htmlFor="category" className="support-label">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="support-select"
                required
                disabled={loading}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="support-field">
              <label htmlFor="priority" className="support-label">
                Priority *
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="support-select"
                required
                disabled={loading}
              >
                {priorities.map(pri => (
                  <option key={pri.value} value={pri.value}>
                    {pri.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="support-field support-field-full">
              <label htmlFor="description" className="support-label">
                Detailed Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="support-textarea"
                placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or relevant information."
                rows={6}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="support-form-actions">
            <button
              type="button"
              className="support-btn support-btn-secondary"
              onClick={goBack}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="support-btn support-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="support-btn-loading">
                  <span className="support-spinner"></span>
                  Submitting...
                </span>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentSupport;
