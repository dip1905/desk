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

// ─── VALIDATION ───────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ─── CHECK SETUP ──────────────────────────────────────
// Always returns false — setup is done via seed script

const checkSetup = async (req, res, next) => {
  try {
    res.status(200).json({
      success:      true,
      isFirstSetup: false,
    });
  } catch (error) {
    next(error);
  }
};

// ─── REGISTER ─────────────────────────────────────────
// Disabled — all accounts created by Admin via /api/employees
// Super Admin created via seed script

const register = async (req, res, next) => {
  try {
    return res.status(403).json({
      success: false,
      message: "Registration is disabled. Contact your Admin to get an account.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── LOGIN ────────────────────────────────────────────
// POST /api/auth/login

const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:  parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact admin.",
      });
    }

    const token = generateToken(user.id);
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
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: {
        id: true, name: true, email: true,
        role: true, avatar: true, isActive: true,
        createdAt: true,
        employee: {
          select: {
            department: true, designation: true,
            employmentType: true, joiningDate: true,
            phone: true,
          }
        }
      },
    });

    res.status(200).json({ success: true, data: user });

  } catch (error) {
    next(error);
  }
};

// ─── LOGOUT ───────────────────────────────────────────
// POST /api/auth/logout

const logout = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { lastSeen: new Date() },
    });

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
      where: { id: req.user.id },
      data: {
        ...(name   && { name }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true, name: true, email: true,
        role: true, avatar: true,
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

    const user    = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

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

// ─── EXPORTS ──────────────────────────────────────────

module.exports = {
  checkSetup,
  register,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword,
};