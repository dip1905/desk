const prisma = require("../../config/db");

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [total, notifications] = await Promise.all([
      prisma.notification.count({
        where: { userId: req.user.id }
      }),
      prisma.notification.findMany({
        where:   { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      })
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          page:       Number(page),
          totalPages: Math.ceil(total / Number(limit)),
        }
      }
    });
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data:  { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) { next(error); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data:  { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) { next(error); }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};