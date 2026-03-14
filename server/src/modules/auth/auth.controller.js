const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { z }  = require("zod");
const prisma = require("../../config/db");

// ─── HELPERS ──────────────────────────────────────────

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ─── VALIDATION SCHEMAS ───────────────────────────────

const registerSchema = z.object({
  name:     z.string().min(2,  "Name must be at least 2 characters"),
  email:    z.string().email("Invalid email address"),
  password: z.string().min(6,  "Password must be at least 6 characters"),
  role:     z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
    "EMPLOYEE"
  ]).optional(),
});

const loginSchema = z.object({
  email:    z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// ─── REGISTER ─────────────────────────────────────────
// POST /api/auth/register

const register = async (req, res, next) => {
  try {
    // Step 1: Validate request body using Zod
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:  parsed.error.flatten().fieldErrors,
      });
    }

    const { name, email, password, role } = parsed.data;

    // Step 2: Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    // Step 3: Hash password
    // 10 = salt rounds — higher is more secure but slower
    // 10 is the industry standard balance
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 4: Create user in database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role:     role || "EMPLOYEE",
      },
      // Never return password in response
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        avatar:    true,
        createdAt: true,
      },
    });

    // Step 5: Generate JWT token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data:    { user, token },
    });

  } catch (error) {
    next(error);
  }
};

// ─── LOGIN ────────────────────────────────────────────
// POST /api/auth/login

const login = async (req, res, next) => {
  try {
    // Step 1: Validate request body
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:  parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsed.data;

    // Step 2: Find user by email
    // We need password here for comparison so no select filter
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Step 3: Check user exists AND password is correct
    // We check both together intentionally
    // Separate checks would leak info like "email not found"
    // which helps attackers know which emails are registered
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Step 4: Check account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact admin.",
      });
    }

    // Step 5: Generate token
    const token = generateToken(user.id);

    // Step 6: Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data:    { user: userWithoutPassword, token },
    });

  } catch (error) {
    next(error);
  }
};

// ─── GET ME ───────────────────────────────────────────
// GET /api/auth/me

const getMe = async (req, res, next) => {
  try {
    // req.user is attached by protect middleware
    // We fetch fresh from DB to get latest data
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        avatar:    true,
        isActive:  true,
        createdAt: true,
        employee: {
          select: {
            department:     true,
            designation:    true,
            employmentType: true,
            joiningDate:    true,
            phone:          true,
          }
        }
      },
    });

    res.status(200).json({
      success: true,
      data:    user,
    });

  } catch (error) {
    next(error);
  }
};

// ─── LOGOUT ───────────────────────────────────────────
// POST /api/auth/logout

const logout = async (req, res, next) => {
  try {
    // Update lastSeen timestamp
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { lastSeen: new Date() },
    });

    // JWT is stateless so actual logout happens
    // on frontend by deleting token from localStorage
    // Backend just confirms and updates lastSeen
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (error) {
    next(error);
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────
// PUT /api/auth/profile

const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;

    if (!name && !avatar) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const user = await prisma.user.update({
      where:  { id: req.user.id },
      data: {
        ...(name   && { name }),
        ...(avatar && { avatar }),
      },
      select: {
        id:     true,
        name:   true,
        email:  true,
        role:   true,
        avatar: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data:    user,
    });

  } catch (error) {
    next(error);
  }
};

// ─── CHANGE PASSWORD ──────────────────────────────────
// PUT /api/auth/change-password

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both old and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    // Get user with password for comparison
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Verify old password is correct
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // Hash and save new password
    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data:  { password: hashed },
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword,
};