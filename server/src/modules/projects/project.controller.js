const { z }  = require("zod");
const prisma = require("../../config/db");

const projectSchema = z.object({
  name:        z.string().min(2),
  description: z.string().optional(),
  status:      z.enum(["PLANNING","ACTIVE","ON_HOLD","COMPLETED"]).optional(),
  deadline:    z.string().optional(),
  memberIds:   z.array(z.string()).optional(),
});

// ─── GET ALL PROJECTS ─────────────────────────────────
const getAllProjects = async (req, res, next) => {
  try {
    const isManager = ["SUPER_ADMIN","ADMIN","MANAGER"]
      .includes(req.user.role);

    // Managers see all projects
    // Employees see only projects they are members of
    const where = isManager ? {} : {
      members: {
        some: { userId: req.user.id }
      }
    };

    const projects = await prisma.project.findMany({
      where,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true, name: true,
                avatar: true, role: true,
              }
            }
          }
        },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data:    projects
    });

  } catch (error) {
    next(error);
  }
};

// ─── GET PROJECT BY ID ────────────────────────────────
const getProjectById = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where:   { id: req.params.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true, name: true,
                avatar: true, role: true, email: true,
              }
            }
          }
        },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, avatar: true }
            },
            createdBy: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { tasks: true, members: true } }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({ success: true, data: project });

  } catch (error) {
    next(error);
  }
};

// ─── CREATE PROJECT ───────────────────────────────────
const createProject = async (req, res, next) => {
  try {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:  parsed.error.flatten().fieldErrors,
      });
    }

    const { name, description, status, deadline, memberIds } = parsed.data;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        status:      status      || "PLANNING",
        deadline:    deadline    ? new Date(deadline) : null,
        members: {
          create: [
            // Creator is always COORDINATOR
            {
              userId:      req.user.id,
              projectRole: "COORDINATOR",
            },
            // Add other members as MEMBER by default
            ...(memberIds || [])
              .filter((id) => id !== req.user.id)
              .map((userId) => ({
                userId,
                projectRole: "MEMBER",
              })),
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    });

    // Notify added members
    if (memberIds && memberIds.length > 0) {
      await prisma.notification.createMany({
        data: memberIds
          .filter((id) => id !== req.user.id)
          .map((userId) => ({
            userId,
            title:   "Added to Project",
            message: `You have been added to project: ${name}`,
            type:    "TASK",
          }))
      });
    }

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data:    project,
    });

  } catch (error) {
    next(error);
  }
};

// ─── UPDATE PROJECT ───────────────────────────────────
const updateProject = async (req, res, next) => {
  try {
    const { name, description, status, deadline } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: req.params.id }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name        && { name }),
        ...(description && { description }),
        ...(status      && { status }),
        ...(deadline    && { deadline: new Date(deadline) }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data:    updated,
    });

  } catch (error) {
    next(error);
  }
};

// ─── DELETE PROJECT ───────────────────────────────────
const deleteProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await prisma.project.delete({ where: { id: req.params.id } });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};

// ─── ADD MEMBER ───────────────────────────────────────
const addMember = async (req, res, next) => {
  try {
    const { userId, projectRole } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const validRoles = [
      "COORDINATOR","TEAM_LEAD","DEVELOPER",
      "DESIGNER","TESTER","MEMBER"
    ];

    const role = validRoles.includes(projectRole)
      ? projectRole
      : "MEMBER";

    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: req.params.id,
          userId,
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this project",
      });
    }

    await prisma.projectMember.create({
      data: {
        projectId:   req.params.id,
        userId,
        projectRole: role,
      }
    });

    // Get project name for notification
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      select: { name: true }
    });

    // Notify the added member
    await prisma.notification.create({
      data: {
        userId,
        title:   "Added to Project",
        message: `You have been added to project "${project?.name}" as ${role.replace("_"," ")}`,
        type:    "TASK",
      }
    });

    res.status(201).json({
      success: true,
      message: "Member added successfully",
    });

  } catch (error) {
    next(error);
  }
};

// ─── UPDATE MEMBER ROLE ───────────────────────────────
const updateMemberRole = async (req, res, next) => {
  try {
    const { projectRole } = req.body;
    const { id: projectId, userId } = req.params;

    const validRoles = [
      "COORDINATOR","TEAM_LEAD","DEVELOPER",
      "DESIGNER","TESTER","MEMBER"
    ];

    if (!validRoles.includes(projectRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project role",
      });
    }

    await prisma.projectMember.update({
      where: {
        projectId_userId: { projectId, userId }
      },
      data: { projectRole }
    });

    res.status(200).json({
      success: true,
      message: "Member role updated",
    });

  } catch (error) {
    next(error);
  }
};

// ─── REMOVE MEMBER ────────────────────────────────────
const removeMember = async (req, res, next) => {
  try {
    await prisma.projectMember.deleteMany({
      where: {
        projectId: req.params.id,
        userId:    req.params.userId,
      }
    });

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
};