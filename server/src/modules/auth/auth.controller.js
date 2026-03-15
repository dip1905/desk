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

// ─── CHECK SETUP ──────────────────────────────────────
// GET /api/auth/check-setup

const checkSetup = async (req, res, next) => {
  try {
    const userCount = await prisma.user.count();
    res.status(200).json({
      success:      true,
      isFirstSetup: userCount === 0,
    });
  } catch (error) {
    next(error);
  }
};

// ─── REGISTER ─────────────────────────────────────────
// POST /api/auth/register

const register = async (req, res, next) => {
  try {
    // Step 1: Validate input
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:  parsed.error.flatten().fieldErrors,
      });
    }

    const { name, email, password, role } = parsed.data;

    // Step 2: Check if this is first time setup
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      // Users already exist
      // Only ADMIN or SUPER_ADMIN can create new accounts
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({
          success: false,
          message: "Only admins can create new accounts. Please contact your administrator.",
        });
      }

      // jwt already imported at top — no require needed
      const token   = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const creator = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!creator || !["ADMIN", "SUPER_ADMIN"].includes(creator.role)) {
        return res.status(403).json({
          success: false,
          message: "Only admins can create new accounts.",
        });
      }
    }

    // Step 3: Check email not already taken
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    // Step 4: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 5: Create user
    // First user is always SUPER_ADMIN
    // regardless of what role was sent in request
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role:     userCount === 0 ? "SUPER_ADMIN" : (role || "EMPLOYEE"),
      },
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        avatar:    true,
        createdAt: true,
      },
    });

    // Step 6: Generate token
    const newToken = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: userCount === 0
        ? "Owner account created. Welcome to Desk!"
        : "Employee account created successfully.",
      data: { user, token: newToken },
    });

  } catch (error) {
    next(error);
  }
};

// ─── LOGIN ────────────────────────────────────────────
// POST /api/auth/login

const login = async (req, res, next) => {
  try {
    // Step 1: Validate input
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
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Step 3: Check user exists AND password matches
    // Both checked together to prevent email enumeration attacks
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

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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

module.exports = {
  checkSetup,
  register,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword,
};