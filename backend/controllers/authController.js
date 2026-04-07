const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getJwtSecret = () => process.env.JWT_SECRET || "unihub_dev_secret";
const isValidSriLankanNic = (nic) => /^(?:\d{12}|\d{9}V)$/i.test((nic || "").trim());
const isValidPhoneStartingZero = (phone) => /^0\d{9}$/.test(String(phone || "").replace(/[\s\-()]/g, ""));

// Register
exports.register = async (req, res) => {
  const {
    name,
    email,
    password,
    studentNumber,
    nic,
    phone,
    specialization,
    year,
    semester,
  } = req.body;

  try {
    // Check for existing email (case-insensitive)
    const emailExists = await User.findOne({ 
      email: { $regex: new RegExp(`^${String(email).trim()}$`, 'i') }
    });
    if (emailExists) return res.status(400).json({ message: "Email already registered" });

    // Check for existing NIC (if provided)
    if (nic && nic.trim()) {
      const nicExists = await User.findOne({ nic: String(nic).trim().toUpperCase() });
      if (nicExists) return res.status(400).json({ message: "NIC already registered" });
    }

    // Check for existing student number (if provided)
    if (studentNumber && studentNumber.trim()) {
      const studentNumberExists = await User.findOne({ studentNumber: String(studentNumber).trim().toUpperCase() });
      if (studentNumberExists) return res.status(400).json({ message: "Student number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: String(email).trim().toLowerCase(), // Normalize email to lowercase
      studentNumber: studentNumber || "",
      nic: nic || "",
      phone: phone || "",
      specialization: specialization || "",
      year: year === "" || year === undefined ? undefined : year,
      semester: semester === "" || semester === undefined ? undefined : semester,
      password: hashedPassword,
      role: "user",
    });

    console.log('User registered:', user.email);

    res.status(201).json({ message: "User Registered Successfully" });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Register Admin (admin-only route)
exports.registerAdmin = async (req, res) => {
  const {
    name,
    email,
    password,
    nic,
    phone,
    status,
  } = req.body;

  try {
    if (!name || !email || !password || !nic) {
      return res.status(400).json({ message: "Name, email, password, and NIC are required" });
    }

    const normalizedNic = String(nic).trim().toUpperCase();
    if (!isValidSriLankanNic(normalizedNic)) {
      return res.status(400).json({ message: "NIC must be 12 digits or 9 digits followed by V" });
    }

    if (status && !["graduate", "undergraduate"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (!isValidPhoneStartingZero(phone)) {
      return res.status(400).json({ message: "Phone must start with 0 and have exactly 10 numbers" });
    }

    // Check for existing email (case-insensitive)
    const emailExists = await User.findOne({ 
      email: { $regex: new RegExp(`^${String(email).trim()}$`, 'i') }
    });
    if (emailExists) return res.status(400).json({ message: "Email already registered" });

    // Check for existing NIC
    const nicExists = await User.findOne({ nic: normalizedNic });
    if (nicExists) return res.status(400).json({ message: "NIC already registered" });

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(), // Normalize email to lowercase
      nic: normalizedNic,
      phone: phone ? String(phone).trim() : "",
      status: status || "undergraduate",
      password: hashedPassword,
      role: "admin",
    });

    res.status(201).json({
      message: "Admin registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        nic: user.nic,
        phone: user.phone,
        status: user.status,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt for:', email);

  try {
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${String(email).trim()}$`, 'i') }
    });
    console.log('User found:', !!user);

    if (!user) return res.status(400).json({ message: "Invalid Email" });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

    const token = jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Forgot Password (simple email existence check)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${String(email).trim()}$`, "i") },
    });

    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    return res.json({ message: "Reset request accepted" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${String(email).trim()}$`, "i") },
    });

    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: error.message });
  }
};
