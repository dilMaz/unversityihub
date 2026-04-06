import { useState } from "react";
import axios from "axios";

function StudentSupportForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    subject: "",
    category: "technical",
    priority: "medium",
    description: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    { value: "technical", label: "Technical Issue" },
    { value: "account", label: "Account Problem" },
    { value: "content", label: "Content Issue" },
    { value: "feature", label: "Feature Request" },
    { value: "other", label: "Other" },
  ];

  const priorities = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
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
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const payload = {
        ...formData,
        userName: user.name || "",
        userEmail: user.email || formData.email,
        userPhone: user.phone || formData.phone,
        userId: user._id,
        status: "open",
        createdAt: new Date().toISOString(),
      };

      const res = await axios.post(
        "http://localhost:5000/api/support/create",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      onSuccess && onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit support request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-modal-overlay">
      <div className="support-modal">
        <div className="support-modal-header">
          <h3>Student Support Request</h3>
          <button 
            type="button" 
            className="support-modal-close" 
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="support-form">
          {error && (
            <div className="support-error">
              {error}
            </div>
          )}

          <div className="support-form-grid">
            <div className="support-field">
              <label htmlFor="subject" className="support-label">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
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

            <div className="support-field">
              <label htmlFor="email" className="support-label">
                Contact Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="support-input"
                placeholder="your.email@example.com"
                disabled={loading}
              />
            </div>

            <div className="support-field">
              <label htmlFor="phone" className="support-label">
                Contact Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="support-input"
                placeholder="+94 XX XXXXXXX"
                disabled={loading}
              />
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
                rows={5}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="support-form-actions">
            <button
              type="button"
              className="support-btn support-btn-secondary"
              onClick={onClose}
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

export default StudentSupportForm;
