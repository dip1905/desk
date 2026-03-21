const prisma      = require("../../config/db");
const cloudinary  = require("../../config/cloudinary");

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    // Convert buffer to base64 for Cloudinary
    const b64    = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder:         "desk/files",
      resource_type:  "auto",
      public_id:      `${Date.now()}_${req.file.originalname}`,
    });

    // Get file type category
    const getType = (mimetype) => {
      if (mimetype.startsWith("image/"))        return "image";
      if (mimetype === "application/pdf")        return "pdf";
      if (mimetype.includes("spreadsheet") ||
          mimetype.includes("excel"))            return "xlsx";
      if (mimetype.includes("word"))             return "doc";
      if (mimetype.includes("zip"))              return "zip";
      return "other";
    };

    // Save to database
    const file = await prisma.fileStore.create({
      data: {
        name:       req.file.originalname,
        url:        result.secure_url,
        publicId:   result.public_id,
        type:       getType(req.file.mimetype),
        size:       req.file.size,
        uploadedBy: req.user.id,
      },
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data:    file,
    });
  } catch (error) { next(error); }
};

const getFiles = async (req, res, next) => {
  try {
    const {
      type, search,
      page = 1, limit = 20
    } = req.query;

    const where = {
      ...(type   && { type }),
      ...(search && {
        name: { contains: search, mode: "insensitive" }
      }),
    };

    const [total, files] = await Promise.all([
      prisma.fileStore.count({ where }),
      prisma.fileStore.findMany({
        where,
        include: {
          uploader: {
            select: { id: true, name: true, avatar: true }
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
        files,
        pagination: {
          total,
          page:       Number(page),
          totalPages: Math.ceil(total / Number(limit)),
        }
      }
    });
  } catch (error) { next(error); }
};

const deleteFile = async (req, res, next) => {
  try {
    const file = await prisma.fileStore.findUnique({
      where: { id: req.params.id }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(req.user.role);

    // Only uploader or admin can delete
    if (file.uploadedBy !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own files",
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(file.publicId, {
      resource_type: "auto"
    });

    // Delete from database
    await prisma.fileStore.delete({ where: { id: req.params.id } });

    res.status(200).json({
      success: true,
      message: "File deleted",
    });
  } catch (error) { next(error); }
};

module.exports = { uploadFile, getFiles, deleteFile };