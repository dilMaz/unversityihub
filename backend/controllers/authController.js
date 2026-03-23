const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
exports.register = async (req, res) => {
  const { name, nic = 'N/A', email, password, phone = 'N/A', status = 'undergraduate', role = 'user' } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      nic,
      email,
      phone,
      status,
      password: hashedPassword,
      role,
    });

    console.log('User registered:', user.email);

    res.status(201).json({ message: "User Registered Successfully" });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt for:', email);

  try {
    const user = await User.findOne({ email });
    console.log('User found:', !!user);

    if (!user) return res.status(400).json({ message: "Invalid Email" });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

    // ✅ Fix — process.env.JWT_SECRET use කරන්න (fallback consistent)
    const secret = process.env.JWT_SECRET || "secretkey";
    const token = jwt.sign({ id: user._id }, secret, {
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
