const prisma = require("../../../config/db");

// ─── CHECK IN ─────────────────────────────────────────
// POST /api/attendance/checkin

const checkIn = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found",
      });
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt:  tomorrow,
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already checked in for today",
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date:       new Date(),
        checkIn:    new Date(),
        status:     "PRESENT",
      }
    });

    res.status(201).json({
      success: true,
      message: `Checked in at ${new Date().toLocaleTimeString()}`,
      data:    attendance,
    });

  } catch (error) {
    next(error);
  }
};

// ─── CHECK OUT ────────────────────────────────────────
// POST /api/attendance/checkout

const checkOut = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found",
      });
    }

    // Find today's check in
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt:  tomorrow,
        }
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "You have not checked in today",
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: "Already checked out for today",
      });
    }

    const checkOutTime = new Date();

    // Calculate working hours
    const diffMs    = checkOutTime - new Date(attendance.checkIn);
    const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data:  { checkOut: checkOutTime },
    });

    res.status(200).json({
      success: true,
      message: `Checked out at ${checkOutTime.toLocaleTimeString()}. Hours worked: ${diffHours}`,
      data:    updated,
    });

  } catch (error) {
    next(error);
  }
};

// ─── GET ATTENDANCE ───────────────────────────────────
// GET /api/attendance

const getAttendance = async (req, res, next) => {
  try {
    const {
      employeeId,
      startDate,
      endDate,
      page  = 1,
      limit = 30,
    } = req.query;

    const isManager = ["SUPER_ADMIN", "ADMIN", "MANAGER"]
      .includes(req.user.role);

    let where = {};

    // Employee can only see own attendance
    if (!isManager) {
      const employee = await prisma.employee.findUnique({
        where: { userId: req.user.id }
      });
      if (employee) {
        where.employeeId = employee.id;
      }
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.date = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate   && { lte: new Date(endDate) }),
      };
    }

    const [total, records] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        include: {
          employee: {
            include: {
              user: {
                select: {
                  id:     true,
                  name:   true,
                  avatar: true,
                }
              }
            }
          }
        },
        orderBy: { date: "desc" },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        records,
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

// ─── MANUAL ATTENDANCE ────────────────────────────────
// POST /api/attendance/manual

const manualAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, status, checkIn, checkOut } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "employeeId, date and status are required",
      });
    }

    if (!["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE"]
      .includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Check if record already exists for this date
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: { gte: dateStart, lte: dateEnd }
      }
    });

    if (existing) {
      // Update existing record
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status,
          ...(checkIn  && { checkIn:  new Date(checkIn) }),
          ...(checkOut && { checkOut: new Date(checkOut) }),
        }
      });

      return res.status(200).json({
        success: true,
        message: "Attendance updated",
        data:    updated,
      });
    }

    // Create new record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date:    new Date(date),
        status,
        ...(checkIn  && { checkIn:  new Date(checkIn) }),
        ...(checkOut && { checkOut: new Date(checkOut) }),
      }
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked",
      data:    attendance,
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  manualAttendance,
};