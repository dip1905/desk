const { z }  = require("zod");
const prisma = require("../../config/db");
const { getIO } = require("../../socket/socket");

const taskSchema = z.object({
  title:        z.string().min(2, "Title is required"),
  description:  z.string().optional(),
  status:       z.enum([
    "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"
  ]).optional(),
  priority:     z.enum([
    "LOW", "MEDIUM", "HIGH", "URGENT"
  ]).optional(),
  deadline:     z.string().optional(),
  projectId:    z.string(),
  assignedToId: z.string().optional(),
});

const getAllTasks = async (req, res, next) => {
  try {
    const {
      projectId, status, priority,
      assignedToMe, page = 1, limit = 50
    } = req.query;

    const where = {
      ...(projectId    && { projectId }),
      ...(status       && { status }),
      ...(priority     && { priority }),
      ...(assignedToMe === "true" && {
        assignedToId: req.user.id
      }),
    };

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, name: true, avatar: true }
          },
          createdBy: {
            select: { id: true, name: true }
          },
          _count: { select: { comments: true } }
        },
        orderBy: { createdAt: "desc" },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          page:       Number(page),
          totalPages: Math.ceil(total / Number(limit)),
        }
      }
    });
  } catch (error) { next(error); }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where:   { id: req.params.id },
      include: {
        assignedTo: {
          select: { id: true, name: true, avatar: true }
        },
        createdBy: {
          select: { id: true, name: true }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        activityLogs: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) { next(error); }
};

const createTask = async (req, res, next) => {
  try {
    const parsed = taskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:  parsed.error.flatten().fieldErrors,
      });
    }

    const {
      title, description, status, priority,
      deadline, projectId, assignedToId
    } = parsed.data;

    const task = await prisma.task.create({
      data: {
        title,
        description:  description  || null,
        status:       status       || "TODO",
        priority:     priority     || "MEDIUM",
        deadline:     deadline ? new Date(deadline) : null,
        projectId,
        assignedToId: assignedToId || null,
        createdById:  req.user.id,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, avatar: true }
        },
      }
    });

    // Create notification if task is assigned
    if (assignedToId && assignedToId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId:  assignedToId,
          title:   "New Task Assigned",
          message: `You have been assigned: ${title}`,
          type:    "TASK",
        }
      });

      // Emit socket notification
      try {
        const io = getIO();
        io.to(assignedToId).emit("notification:new", {
          title:   "New Task Assigned",
          message: `You have been assigned: ${title}`,
          type:    "TASK",
        });
      } catch { /* socket not ready */ }
    }

    res.status(201).json({
      success: true,
      message: "Task created",
      data:    task,
    });
  } catch (error) { next(error); }
};

const updateTask = async (req, res, next) => {
  try {
    const {
      title, description, priority,
      deadline, assignedToId
    } = req.body;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title        && { title }),
        ...(description  && { description }),
        ...(priority     && { priority }),
        ...(deadline     && { deadline: new Date(deadline) }),
        ...(assignedToId !== undefined && { assignedToId }),
      }
    });

    res.status(200).json({
      success: true,
      message: "Task updated",
      data:    task,
    });
  } catch (error) { next(error); }
};

const deleteTask = async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) { next(error); }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]
      .includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: req.params.id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data:  { status },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        taskId: req.params.id,
        action: `Status changed from ${task.status} to ${status}`,
        userId: req.user.id,
      }
    });

    res.status(200).json({
      success: true,
      message: "Task status updated",
      data:    updated,
    });
  } catch (error) { next(error); }
};

const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId:   req.params.id,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "Comment added",
      data:    comment,
    });
  } catch (error) { next(error); }
};

const getActivityLog = async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where:   { taskId: req.params.id },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) { next(error); }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addComment,
  getActivityLog,
};