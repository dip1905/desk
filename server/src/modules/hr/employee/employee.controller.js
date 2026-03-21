const bcrypt = require("bcryptjs");
const { z }  = require("zod");
const prisma = require("../../../config/db");

// ─── VALIDATION SCHEMA ────────────────────────────────

const createEmployeeSchema = z.object({
  // User fields
  name:           z.string().min(2, "Name must be at least 2 characters"),
  email:          z.string().email("Invalid email"),
  password:       z.string().min(6, "Password must be at least 6 characters"),
  role:           z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),

  // Employee fields
  department:     z.enum([
    "ENGINEERING", "DESIGN", "MARKETING",
    "SALES", "HR", "FINANCE"
  ]),
  designation:    z.string().min(2, "Designation is required"),
  employmentType: z.enum([
    "FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"
  ]),
  salary:         z.number().positive("Salary must be positive"),
  joiningDate:    z.string(),
  phone:          z.string().optional(),
  address:        z.string().optional(),
});

const updateEmployeeSchema = z.object({
  // User fields
  name:           z.string().min(2).optional(),
  role:           z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),

  // Employee fields
  department:     z.enum([
    "ENGINEERING", "DESIGN", "MARKETING",
    "SALES", "HR", "FINANCE"
  ]).optional(),
  designation:    z.string().min(2).optional(),
  employmentType: z.enum([
    "FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"
  ]).optional(),
  salary:         z.number().positive().optional(),
  phone:          z.string().optional(),
  address:        z.string().optional(),
});

// ─── GET ALL EMPLOYEES ────────────────────────────────
// GET /api/employees

const getAllEmployees = async (req, res, next) => {
  try {
    const {
      department,
      employmentType,
      search,
      page  = 1,
      limit = 20,
    } = req.query;

    // Build dynamic filter
    const where = {
      isActive: true,
      // Search by name or email
      ...(search && {
        OR: [
          { name:  { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ]
      }),
      // Filter by department or employment type via employee relation
      ...(department || employmentType
        ? {
            employee: {
              ...(department     && { department }),
              ...(employmentType && { employmentType }),
            }
          }
        : {}
      ),
    };

    // Run count and data queries in parallel for performance
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
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
              id:             true,
              department:     true,
              designation:    true,
              employmentType: true,
              joiningDate:    true,
              phone:          true,
              // Salary excluded — use getEmployeeById for sensitive data
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip:  (Number(page) - 1) * Number(limit),
        take:  Number(limit),
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        employees: users,
        pagination: {
          total,
          page:       Number(page),
          limit:      Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// ─── GET EMPLOYEE BY ID ───────────────────────────────
// GET /api/employees/:id

const getEmployeeById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.params.id },
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        avatar:    true,
        isActive:  true,
        lastSeen:  true,
        createdAt: true,
        employee: {
          select: {
            id:             true,
            department:     true,
            designation:    true,
            employmentType: true,
            joiningDate:    true,
            phone:          true,
            address:        true,
            leaveBalance:   true,
            // Show salary only to ADMIN and SUPER_ADMIN
            ...(["ADMIN", "SUPER_ADMIN"].includes(req.user.role)
              ? { salary: true }
              : {}
            ),
          }
        },
        // Last 5 leaves
        _count: {
          select: {
            assignedTasks: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      data:    user,
    });

  } catch (error) {
    next(error);
  }
};

// ─── CREATE EMPLOYEE ──────────────────────────────────
// POST /api/employees
// Admin creates employee account with credentials

const createEmployee = async (req, res, next) => {
  try {
    // Validate input
    const parsed = createEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:  parsed.error.flatten().fieldErrors,
      });
    }

    const {
      name, email, password, role,
      department, designation, employmentType,
      salary, joiningDate, phone, address,
    } = parsed.data;

    // Check email not taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User + Employee in one transaction
    // Transaction = both succeed or both fail — no partial data
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role:     role || "EMPLOYEE",
        },
      });

      await tx.employee.create({
        data: {
          userId:         newUser.id,
          department,
          designation,
          employmentType,
          salary,
          joiningDate:    new Date(joiningDate),
          phone:          phone || null,
          address:        address || null,
        },
      });

      return newUser;
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data:    userWithoutPassword,
    });

  } catch (error) {
    next(error);
  }
};

// ─── UPDATE EMPLOYEE ──────────────────────────────────
// PUT /api/employees/:id

const updateEmployee = async (req, res, next) => {
  try {
    const parsed = updateEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:  parsed.error.flatten().fieldErrors,
      });
    }

    const {
      name, role,
      department, designation, employmentType,
      salary, phone, address,
    } = parsed.data;

    // Check employee exists
    const existing = await prisma.user.findUnique({
      where:   { id: req.params.id },
      include: { employee: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Update both User and Employee in transaction
    await prisma.$transaction(async (tx) => {
      // Update User fields
      if (name || role) {
        await tx.user.update({
          where: { id: req.params.id },
          data: {
            ...(name && { name }),
            ...(role && { role }),
          },
        });
      }

      // Update Employee fields
      if (existing.employee) {
        await tx.employee.update({
          where: { userId: req.params.id },
          data: {
            ...(department     && { department }),
            ...(designation    && { designation }),
            ...(employmentType && { employmentType }),
            ...(salary         && { salary }),
            ...(phone          && { phone }),
            ...(address        && { address }),
          },
        });
      }
    });

    // Fetch updated user
    const updated = await prisma.user.findUnique({
      where:  { id: req.params.id },
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        avatar:    true,
        employee:  true,
      }
    });

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data:    updated,
    });

  } catch (error) {
    next(error);
  }
};

// ─── DELETE EMPLOYEE ──────────────────────────────────
// DELETE /api/employees/:id
// Soft delete — deactivate account, not physical delete

const deleteEmployee = async (req, res, next) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Soft delete — just set isActive to false
    // We never physically delete users
    // Why? Historical data (tasks, messages) must remain intact
    await prisma.user.update({
      where: { id: req.params.id },
      data:  { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: "Employee deactivated successfully",
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};