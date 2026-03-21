const { z }  = require("zod");
const prisma = require("../../../config/db");

// ─── VALIDATION ───────────────────────────────────────

const applyLeaveSchema = z.object({
  type:   z.enum(["sick", "casual", "earned"]),
  from:   z.string(),
  to:     z.string(),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

// ─── APPLY LEAVE ──────────────────────────────────────
// POST /api/leaves

const applyLeave = async (req, res, next) => {
  try {
    const parsed = applyLeaveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:  parsed.error.flatten().fieldErrors,
      });
    }

    const { type, from, to, reason } = parsed.data;

    const fromDate = new Date(from);
    const toDate   = new Date(to);
    const today    = new Date();
    today.setHours(0, 0, 0, 0);

    // Cannot apply for past dates
    if (fromDate < today) {
      return res.status(400).json({
        success: false,
        message: "Cannot apply leave for past dates",
      });
    }

    // from must be before or equal to to
    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: "From date must be before To date",
      });
    }

    // Get employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found. Contact admin.",
      });
    }

    // Calculate number of days requested
    const diffTime = Math.abs(toDate - fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const balance = employee.leaveBalance;
    if (balance[type] < diffDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${type} leave balance. Available: ${balance[type]} days, Requested: ${diffDays} days`,
      });
    }

    // Create leave request
    const leave = await prisma.leave.create({
      data: {
        employeeId: employee.id,
        type,
        from:       fromDate,
        to:         toDate,
        reason,
        status:     "PENDING",
      },
      include: {
        employee: {
          include: { user: { select: { name: true, email: true } } }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: `Leave application submitted. Requested ${diffDays} day(s).`,
      data:    leave,
    });

  } catch (error) {
    next(error);
  }
};

// ─── GET ALL LEAVES ───────────────────────────────────
// GET /api/leaves

const getAllLeaves = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const isManager = ["SUPER_ADMIN", "ADMIN", "MANAGER"]
      .includes(req.user.role);

    // Managers see all leaves
    // Employees see only their own
    let where = {};

    if (!isManager) {
      const employee = await prisma.employee.findUnique({
        where: { userId: req.user.id }
      });
      if (employee) {
        where.employeeId = employee.id;
      }
    }

    if (status) {
      where.status = status;
    }

    const [total, leaves] = await Promise.all([
      prisma.leave.count({ where }),
      prisma.leave.findMany({
        where,
        include: {
          employee: {
            include: {
              user: {
                select: {
                  id:     true,
                  name:   true,
                  email:  true,
                  avatar: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        leaves,
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

// ─── UPDATE LEAVE STATUS ──────────────────────────────
// PATCH /api/leaves/:id/status

const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be APPROVED or REJECTED",
      });
    }

    const leave = await prisma.leave.findUnique({
      where:   { id: req.params.id },
      include: { employee: true },
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Leave is already ${leave.status}`,
      });
    }

    // If approved → deduct from leave balance
    if (status === "APPROVED") {
      const diffTime = Math.abs(
        new Date(leave.to) - new Date(leave.from)
      );
      const diffDays = Math.ceil(
        diffTime / (1000 * 60 * 60 * 24)
      ) + 1;

      const currentBalance = leave.employee.leaveBalance;
      const updatedBalance  = {
        ...currentBalance,
        [leave.type]: currentBalance[leave.type] - diffDays,
      };

      // Update balance and leave status in transaction
      await prisma.$transaction([
        prisma.employee.update({
          where: { id: leave.employeeId },
          data:  { leaveBalance: updatedBalance },
        }),
        prisma.leave.update({
          where: { id: req.params.id },
          data:  { status, reviewNote: reviewNote || null },
        }),
      ]);

    } else {
      // Rejected — just update status
      await prisma.leave.update({
        where: { id: req.params.id },
        data:  { status, reviewNote: reviewNote || null },
      });
    }

    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId:  leave.employee.userId,
        title:   `Leave ${status}`,
        message: `Your ${leave.type} leave request has been ${status.toLowerCase()}.${reviewNote ? ` Note: ${reviewNote}` : ""}`,
        type:    "LEAVE",
      }
    });

    res.status(200).json({
      success: true,
      message: `Leave ${status.toLowerCase()} successfully`,
    });

  } catch (error) {
    next(error);
  }
};

// ─── CANCEL LEAVE ─────────────────────────────────────
// DELETE /api/leaves/:id

const cancelLeave = async (req, res, next) => {
  try {
    const leave = await prisma.leave.findUnique({
      where:   { id: req.params.id },
      include: { employee: true },
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    // Can only cancel own leave
    if (leave.employee.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own leave",
      });
    }

    // Can only cancel PENDING leaves
    if (leave.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${leave.status} leave`,
      });
    }

    await prisma.leave.delete({
      where: { id: req.params.id }
    });

    res.status(200).json({
      success: true,
      message: "Leave cancelled successfully",
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave,
  getAllLeaves,
  updateLeaveStatus,
  cancelLeave,
};