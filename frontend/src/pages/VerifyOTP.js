import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

function VerifyOTP() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  useEffect(() => {
    const pendingRegistration = localStorage.getItem("pendingRegistration");
    if (!pendingRegistration) {
      navigate("/register");
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6).split("");
      const newOtp = ["", "", "", "", "", ""];
      pastedData.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      
      // Focus on the last filled input
      const lastFilledIndex = newOtp.findIndex((val, i) => i === 5 || val === "");
      if (lastFilledIndex > -1 && inputRefs.current[lastFilledIndex]) {
        inputRefs.current[lastFilledIndex].focus();
      }
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    handleOtpChange(0, pastedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const pendingRegistration = JSON.parse(localStorage.getItem("pendingRegistration"));
      
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email: pendingRegistration.email,
        otp: otpCode,
      });

      // Clear pending registration
      localStorage.removeItem("pendingRegistration");

      // Save token and user info
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("userRole", res.data.user?.role || "user");

      if (res.data.user?.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setError("");

    try {
      const pendingRegistration = JSON.parse(localStorage.getItem("pendingRegistration"));
      
      await axios.post("http://localhost:5000/api/auth/resend-otp", {
        email: pendingRegistration.email,
      });

      // Reset timer
      setTimer(60);
      setCanResend(false);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          <div className="auth-brand-name">Verify OTP</div>
        </div>

        <h2>Enter Verification Code</h2>
        <p className="auth-subtitle">We've sent a 6-digit code to your phone number</p>

        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength="1"
                className="otp-input"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={loading}
              />
            ))}
          </div>

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? (
              <span className="auth-loading">
                <span className="auth-spinner"></span>
                Verifying...
              </span>
            ) : (
              "Verify & Continue"
            )}
          </button>
        </form>

        <div className="otp-resend-section">
          <p className="otp-resend-text">
            Didn't receive the code?
          </p>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={!canResend || resendLoading}
            className="otp-resend-btn"
          >
            {resendLoading ? (
              <span className="auth-loading">
                <span className="auth-spinner"></span>
                Sending...
              </span>
            ) : canResend ? (
              "Resend Code"
            ) : (
              `Resend in ${formatTime(timer)}`
            )}
          </button>
        </div>

        <div className="auth-link">
          <button 
            type="button" 
            onClick={() => {
              localStorage.removeItem("pendingRegistration");
              navigate("/register");
            }}
            className="auth-back-btn"
          >
            ← Back to Registration
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;
