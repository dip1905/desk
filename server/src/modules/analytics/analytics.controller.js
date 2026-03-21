const prisma = require("../../config/db");

const getOverview = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalEmployees,
      activeProjects,
      tasksDueToday,
      pendingLeaves,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.project.count({ where: { status: "ACTIVE" } }),
      prisma.task.count({
        where: {
          deadline: { gte: today, lt: tomorrow },
          status:   { not: "DONE" }
        }
      }),
      prisma.leave.count({ where: { status: "PENDING" } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeProjects,
        tasksDueToday,
        pendingLeaves,
      }
    });
  } catch (error) { next(error); }
};

const getTaskStats = async (req, res, next) => {
  try {
    const [todo, inProgress, inReview, done] = await Promise.all([
      prisma.task.count({ where: { status: "TODO" } }),
      prisma.task.count({ where: { status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { status: "IN_REVIEW" } }),
      prisma.task.count({ where: { status: "DONE" } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        todo,
        inProgress,
        inReview,
        done,
        total: todo + inProgress + inReview + done,
      }
    });
  } catch (error) { next(error); }
};

const getAttendanceStats = async (req, res, next) => {
  try {
    // Get last 7 days attendance
    const days  = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [present, absent, halfDay] = await Promise.all([
        prisma.attendance.count({
          where: {
            date:   { gte: date, lt: nextDate },
            status: "PRESENT",
          }
        }),
        prisma.attendance.count({
          where: {
            date:   { gte: date, lt: nextDate },
            status: "ABSENT",
          }
        }),
        prisma.attendance.count({
          where: {
            date:   { gte: date, lt: nextDate },
            status: "HALF_DAY",
          }
        }),
      ]);

      days.push({
        date:     date.toISOString().split("T")[0],
        day:      date.toLocaleDateString("en", { weekday: "short" }),
        present,
        absent,
        halfDay,
      });
    }

    res.status(200).json({ success: true, data: days });
  } catch (error) { next(error); }
};

const getMySummary = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    });

    const myTasks = await prisma.task.groupBy({
      by:    ["status"],
      where: { assignedToId: req.user.id },
      _count: { status: true },
    });

    const taskSummary = {
      todo:       0,
      inProgress: 0,
      inReview:   0,
      done:       0,
    };

    myTasks.forEach((t) => {
      if (t.status === "TODO")        taskSummary.todo       = t._count.status;
      if (t.status === "IN_PROGRESS") taskSummary.inProgress = t._count.status;
      if (t.status === "IN_REVIEW")   taskSummary.inReview   = t._count.status;
      if (t.status === "DONE")        taskSummary.done       = t._count.status;
    });

    let attendanceThisMonth = 0;
    if (employee) {
      attendanceThisMonth = await prisma.attendance.count({
        where: {
          employeeId: employee.id,
          date: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth(), 1
            ),
          },
          status: "PRESENT",
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tasks:               taskSummary,
        attendanceThisMonth,
        leaveBalance:        employee?.leaveBalance || null,
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getTaskStats,
  getAttendanceStats,
  getMySummary,
};