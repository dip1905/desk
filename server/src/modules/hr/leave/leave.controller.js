const { z }  = require("zod");
const prisma = require("../../../config/db");

const applyLeaveSchema = z.object({
  type:   z.enum(["sick", "casual", "earned"]),
  from:   z.string(),
  to:     z.string(),
  reason: z.string().min(5),
});

// ─── APPLY LEAVE ──────────────────────────────────────
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

    if (fromDate < today) {
      return res.status(400).json({
        success: false,
        message: "Cannot apply leave for past dates",
      });
    }

    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: "From date must be before To date",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found. Contact admin.",
      });
    }

    const diffTime = Math.abs(toDate - fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const balance  = employee.leaveBalance;

    if (balance[type] < diffDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${type} leave balance. Available: ${balance[type]} days, Requested: ${diffDays} days`,
      });
    }

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
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    });

    // Notify managers about new leave request
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ["MANAGER", "ADMIN", "SUPER_ADMIN"] },
        isActive: true,
      }
    });

    await prisma.notification.createMany({
      data: managers.map((m) => ({
        userId:  m.id,
        title:   "New Leave Request",
        message: `${req.user.name} has applied for ${type} leave from ${fromDate.toDateString()} to ${toDate.toDateString()}`,
        type:    "LEAVE",
      }))
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
const getAllLeaves = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const isManager = ["SUPER_ADMIN","ADMIN","MANAGER"]
      .includes(req.user.role);

    let where = {};

    if (!isManager) {
      const employee = await prisma.employee.findUnique({
        where: { userId: req.user.id }
      });
      if (employee) where.employeeId = employee.id;
    }

    if (status) where.status = status;

    const [total, leaves] = await Promise.all([
      prisma.leave.count({ where }),
      prisma.leave.findMany({
        where,
        include: {
          employee: {
            include: {
              user: {
                select: {
                  id: true, name: true,
                  email: true, avatar: true,
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

// ─── UPDATE LEAVE STATUS (TWO STEP) ──────────────────
// Step 1: Manager approves → status becomes MANAGER_APPROVED
// Step 2: HR (Admin) confirms → status becomes APPROVED
const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;

    const validStatuses = [
      "MANAGER_APPROVED",
      "APPROVED",
      "REJECTED"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be MANAGER_APPROVED, APPROVED or REJECTED",
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

    // Manager can only do first approval
    if (req.user.role === "MANAGER") {
      if (leave.status !== "PENDING") {
        return res.status(400).json({
          success: false,
          message: `Leave is already ${leave.status}`,
        });
      }
      if (status !== "MANAGER_APPROVED" && status !== "REJECTED") {
        return res.status(403).json({
          success: false,
          message: "Managers can only approve or reject pending leaves",
        });
      }
    }

    // HR (Admin) can do final approval
    if (["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
      if (status === "APPROVED" && leave.status !== "MANAGER_APPROVED") {
        return res.status(400).json({
          success: false,
          message: "Leave must be manager approved first",
        });
      }
    }

    // Deduct balance on final APPROVED
    if (status === "APPROVED") {
      const diffDays = Math.ceil(
        Math.abs(new Date(leave.to) - new Date(leave.from))
        / (1000 * 60 * 60 * 24)
      ) + 1;

      const updatedBalance = {
        ...leave.employee.leaveBalance,
        [leave.type]: leave.employee.leaveBalance[leave.type] - diffDays,
      };

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
      await prisma.leave.update({
        where: { id: req.params.id },
        data:  { status, reviewNote: reviewNote || null },
      });
    }

    // Notify employee
    const notifMessage = status === "MANAGER_APPROVED"
      ? `Your ${leave.type} leave has been approved by manager. Awaiting HR confirmation.`
      : status === "APPROVED"
        ? `Your ${leave.type} leave has been fully approved by HR.`
        : `Your ${leave.type} leave has been rejected. ${reviewNote ? `Note: ${reviewNote}` : ""}`;

    await prisma.notification.create({
      data: {
        userId:  leave.employee.userId,
        title:   `Leave ${status.replace("_", " ")}`,
        message: notifMessage,
        type:    "LEAVE",
      }
    });

    res.status(200).json({
      success: true,
      message: `Leave ${status.replace("_", " ").toLowerCase()} successfully`,
    });

  } catch (error) {
    next(error);
  }
};

// ─── CANCEL LEAVE ─────────────────────────────────────
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

    if (leave.employee.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own leave",
      });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${leave.status} leave`,
      });
    }

    await prisma.leave.delete({ where: { id: req.params.id } });

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