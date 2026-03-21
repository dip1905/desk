const { z }  = require("zod");
const prisma = require("../../config/db");

const projectSchema = z.object({
  name:        z.string().min(2, "Name is required"),
  description: z.string().optional(),
  status:      z.enum([
    "PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"
  ]).optional(),
  deadline:    z.string().optional(),
  memberIds:   z.array(z.string()).optional(),
});

const getAllProjects = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const isManager = ["SUPER_ADMIN", "ADMIN", "MANAGER"]
      .includes(req.user.role);

    const where = {
      ...(status && { status }),
      ...(search && {
        name: { contains: search, mode: "insensitive" }
      }),
      // Employees only see projects they are members of
      ...(!isManager && {
        members: {
          some: { userId: req.user.id }
        }
      }),
    };

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true, name: true, avatar: true
                }
              }
            }
          },
          _count: { select: { tasks: true } }
        },
        orderBy: { createdAt: "desc" },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          total,
          page:       Number(page),
          totalPages: Math.ceil(total / Number(limit)),
        }
      }
    });
  } catch (error) { next(error); }
};

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
                avatar: true, role: true
              }
            }
          }
        },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { createdAt: "desc" }
        },
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) { next(error); }
};

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
        deadline:    deadline ? new Date(deadline) : null,
        members: {
          create: [
            { userId: req.user.id }, // Creator is always a member
            ...(memberIds || [])
              .filter((id) => id !== req.user.id)
              .map((userId) => ({ userId })),
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

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data:    project,
    });
  } catch (error) { next(error); }
};

const updateProject = async (req, res, next) => {
  try {
    const { name, description, status, deadline } = req.body;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name        && { name }),
        ...(description && { description }),
        ...(status      && { status }),
        ...(deadline    && { deadline: new Date(deadline) }),
      }
    });

    res.status(200).json({
      success: true,
      message: "Project updated",
      data:    project,
    });
  } catch (error) { next(error); }
};

const deleteProject = async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(200).json({
      success: true,
      message: "Project deleted",
    });
  } catch (error) { next(error); }
};

const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    await prisma.projectMember.create({
      data: { projectId: req.params.id, userId }
    });

    res.status(201).json({
      success: true,
      message: "Member added",
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "User is already a member",
      });
    }
    next(error);
  }
};

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
      message: "Member removed",
    });
  } catch (error) { next(error); }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};