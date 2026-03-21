const { PrismaClient } = require("@prisma/client");
const bcrypt           = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Desk database...");

  // ─── CLEAN EXISTING DATA ──────────────────────────
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.fileStore.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Cleaned existing data");

  const password = await bcrypt.hash("Admin@123", 10);

  // ─── USERS ────────────────────────────────────────
  const superAdmin = await prisma.user.create({
    data: {
      name:     "Super Admin",
      email:    "superadmin@desk.com",
      password,
      role:     "SUPER_ADMIN",
      isActive: true,
    }
  });

  const hrManager = await prisma.user.create({
    data: {
      name:     "HR Manager",
      email:    "hr@desk.com",
      password,
      role:     "ADMIN",
      isActive: true,
    }
  });

  const projectManager = await prisma.user.create({
    data: {
      name:     "Amit Sharma",
      email:    "amit@desk.com",
      password,
      role:     "MANAGER",
      isActive: true,
    }
  });

  const dev1 = await prisma.user.create({
    data: {
      name:     "Priya Patel",
      email:    "priya@desk.com",
      password,
      role:     "EMPLOYEE",
      isActive: true,
    }
  });

  const dev2 = await prisma.user.create({
    data: {
      name:     "Rahul Verma",
      email:    "rahul@desk.com",
      password,
      role:     "EMPLOYEE",
      isActive: true,
    }
  });

  const designer = await prisma.user.create({
    data: {
      name:     "Sneha Joshi",
      email:    "sneha@desk.com",
      password,
      role:     "EMPLOYEE",
      isActive: true,
    }
  });

  console.log("✅ Users created");

  // ─── EMPLOYEES ────────────────────────────────────
  await prisma.employee.create({
    data: {
      userId:         hrManager.id,
      department:     "HR",
      designation:    "HR Manager",
      employmentType: "FULL_TIME",
      salary:         65000,
      joiningDate:    new Date("2024-01-15"),
      phone:          "9876543210",
      leaveBalance:   { sick: 10, casual: 10, earned: 15 },
    }
  });

  await prisma.employee.create({
    data: {
      userId:         projectManager.id,
      department:     "ENGINEERING",
      designation:    "Project Manager",
      employmentType: "FULL_TIME",
      salary:         75000,
      joiningDate:    new Date("2024-02-01"),
      phone:          "9876543211",
      leaveBalance:   { sick: 8, casual: 9, earned: 15 },
    }
  });

  const priyaEmployee = await prisma.employee.create({
    data: {
      userId:         dev1.id,
      department:     "ENGINEERING",
      designation:    "Software Engineer",
      employmentType: "FULL_TIME",
      salary:         55000,
      joiningDate:    new Date("2024-03-10"),
      phone:          "9876543212",
      leaveBalance:   { sick: 7, casual: 8, earned: 12 },
    }
  });

  const rahulEmployee = await prisma.employee.create({
    data: {
      userId:         dev2.id,
      department:     "ENGINEERING",
      designation:    "Backend Developer",
      employmentType: "FULL_TIME",
      salary:         52000,
      joiningDate:    new Date("2024-04-05"),
      phone:          "9876543213",
      leaveBalance:   { sick: 10, casual: 10, earned: 15 },
    }
  });

  const snehaEmployee = await prisma.employee.create({
    data: {
      userId:         designer.id,
      department:     "DESIGN",
      designation:    "UI/UX Designer",
      employmentType: "FULL_TIME",
      salary:         50000,
      joiningDate:    new Date("2024-05-20"),
      phone:          "9876543214",
      leaveBalance:   { sick: 9, casual: 10, earned: 13 },
    }
  });

  console.log("✅ Employees created");

  // ─── LEAVES ───────────────────────────────────────
  await prisma.leave.create({
    data: {
      employeeId: priyaEmployee.id,
      type:       "casual",
      from:       new Date("2026-04-01"),
      to:         new Date("2026-04-02"),
      reason:     "Personal work",
      status:     "APPROVED",
      reviewNote: "Approved. Enjoy your time off!",
    }
  });

  await prisma.leave.create({
    data: {
      employeeId: rahulEmployee.id,
      type:       "sick",
      from:       new Date("2026-04-05"),
      to:         new Date("2026-04-05"),
      reason:     "Not feeling well",
      status:     "PENDING",
    }
  });

  await prisma.leave.create({
    data: {
      employeeId: snehaEmployee.id,
      type:       "earned",
      from:       new Date("2026-04-10"),
      to:         new Date("2026-04-12"),
      reason:     "Family vacation",
      status:     "REJECTED",
      reviewNote: "Project deadline conflicts. Please reschedule.",
    }
  });

  console.log("✅ Leaves created");

  // ─── ATTENDANCE ───────────────────────────────────
  const employees = [
    priyaEmployee, rahulEmployee, snehaEmployee
  ];

  // Last 7 days attendance
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    for (const emp of employees) {
      const checkIn  = new Date(date);
      const checkOut = new Date(date);
      checkIn.setHours(9, 0, 0, 0);
      checkOut.setHours(18, 0, 0, 0);

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date,
          checkIn,
          checkOut,
          status: "PRESENT",
        }
      });
    }
  }

  console.log("✅ Attendance records created");

  // ─── PROJECTS ─────────────────────────────────────
  const project1 = await prisma.project.create({
    data: {
      name:        "Desk Platform Development",
      description: "Building the core Desk productivity platform with all modules",
      status:      "ACTIVE",
      deadline:    new Date("2026-12-31"),
      members: {
        create: [
          { userId: projectManager.id },
          { userId: dev1.id },
          { userId: dev2.id },
          { userId: designer.id },
        ]
      }
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name:        "Mobile App Design",
      description: "Designing the mobile version of Desk for iOS and Android",
      status:      "PLANNING",
      deadline:    new Date("2026-09-30"),
      members: {
        create: [
          { userId: projectManager.id },
          { userId: designer.id },
        ]
      }
    }
  });

  const project3 = await prisma.project.create({
    data: {
      name:        "API Integration Layer",
      description: "Building third party API integrations for Desk",
      status:      "ACTIVE",
      deadline:    new Date("2026-08-15"),
      members: {
        create: [
          { userId: projectManager.id },
          { userId: dev2.id },
        ]
      }
    }
  });

  console.log("✅ Projects created");

  // ─── TASKS ────────────────────────────────────────
  const task1 = await prisma.task.create({
    data: {
      title:       "Setup authentication system",
      description: "Implement JWT based auth with role based access control",
      status:      "DONE",
      priority:    "HIGH",
      deadline:    new Date("2026-03-15"),
      projectId:   project1.id,
      assignedToId: dev2.id,
      createdById: projectManager.id,
    }
  });

  const task2 = await prisma.task.create({
    data: {
      title:       "Build Kanban board UI",
      description: "Create drag and drop kanban board with react-beautiful-dnd",
      status:      "DONE",
      priority:    "HIGH",
      deadline:    new Date("2026-03-20"),
      projectId:   project1.id,
      assignedToId: dev1.id,
      createdById: projectManager.id,
    }
  });

  const task3 = await prisma.task.create({
    data: {
      title:       "Design dashboard UI",
      description: "Create the analytics dashboard with charts and stat cards",
      status:      "IN_REVIEW",
      priority:    "MEDIUM",
      deadline:    new Date("2026-03-25"),
      projectId:   project1.id,
      assignedToId: designer.id,
      createdById: projectManager.id,
    }
  });

  const task4 = await prisma.task.create({
    data: {
      title:       "Implement real time chat",
      description: "Setup Socket.io for real time messaging with edit and delete",
      status:      "IN_PROGRESS",
      priority:    "HIGH",
      deadline:    new Date("2026-04-05"),
      projectId:   project1.id,
      assignedToId: dev1.id,
      createdById: projectManager.id,
    }
  });

  const task5 = await prisma.task.create({
    data: {
      title:       "File upload with Cloudinary",
      description: "Implement file upload system with Cloudinary storage",
      status:      "IN_PROGRESS",
      priority:    "MEDIUM",
      deadline:    new Date("2026-04-10"),
      projectId:   project1.id,
      assignedToId: dev2.id,
      createdById: projectManager.id,
    }
  });

  const task6 = await prisma.task.create({
    data: {
      title:       "Mobile app wireframes",
      description: "Create wireframes for all mobile app screens",
      status:      "TODO",
      priority:    "MEDIUM",
      deadline:    new Date("2026-05-01"),
      projectId:   project2.id,
      assignedToId: designer.id,
      createdById: projectManager.id,
    }
  });

  const task7 = await prisma.task.create({
    data: {
      title:       "Write API documentation",
      description: "Document all REST API endpoints with examples",
      status:      "TODO",
      priority:    "LOW",
      deadline:    new Date("2026-04-30"),
      projectId:   project3.id,
      assignedToId: dev2.id,
      createdById: projectManager.id,
    }
  });

  // ─── ACTIVITY LOGS ────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      {
        taskId:    task1.id,
        action:    "Task created by Amit Sharma",
        userId:    projectManager.id,
        createdAt: new Date("2026-03-10"),
      },
      {
        taskId:    task1.id,
        action:    "Status changed from TODO to IN_PROGRESS by Rahul Verma",
        userId:    dev2.id,
        createdAt: new Date("2026-03-12"),
      },
      {
        taskId:    task1.id,
        action:    "Status changed from IN_PROGRESS to DONE by Rahul Verma",
        userId:    dev2.id,
        createdAt: new Date("2026-03-14"),
      },
      {
        taskId:    task2.id,
        action:    "Task created by Amit Sharma",
        userId:    projectManager.id,
        createdAt: new Date("2026-03-15"),
      },
      {
        taskId:    task2.id,
        action:    "Status changed from TODO to DONE by Priya Patel",
        userId:    dev1.id,
        createdAt: new Date("2026-03-19"),
      },
    ]
  });

  // ─── COMMENTS ─────────────────────────────────────
  await prisma.comment.createMany({
    data: [
      {
        content:  "Started working on this. Will update by EOD.",
        taskId:   task4.id,
        authorId: dev1.id,
      },
      {
        content:  "Socket server setup done. Working on client side now.",
        taskId:   task4.id,
        authorId: dev1.id,
      },
      {
        content:  "Cloudinary account setup done. Starting integration.",
        taskId:   task5.id,
        authorId: dev2.id,
      },
    ]
  });

  console.log("✅ Tasks and comments created");

  // ─── CHANNELS ─────────────────────────────────────
  const generalChannel = await prisma.channel.create({
    data: {
      name:      "general",
      isPrivate: false,
      members: {
        create: [
          { userId: superAdmin.id },
          { userId: hrManager.id },
          { userId: projectManager.id },
          { userId: dev1.id },
          { userId: dev2.id },
          { userId: designer.id },
        ]
      }
    }
  });

  const devChannel = await prisma.channel.create({
    data: {
      name:      "engineering",
      isPrivate: false,
      members: {
        create: [
          { userId: projectManager.id },
          { userId: dev1.id },
          { userId: dev2.id },
        ]
      }
    }
  });

  const designChannel = await prisma.channel.create({
    data: {
      name:      "design",
      isPrivate: false,
      members: {
        create: [
          { userId: projectManager.id },
          { userId: designer.id },
        ]
      }
    }
  });

  // ─── MESSAGES ─────────────────────────────────────
  await prisma.message.createMany({
    data: [
      {
        content:   "Welcome to Desk! 🎉 This is our new team platform.",
        channelId: generalChannel.id,
        senderId:  superAdmin.id,
        createdAt: new Date("2026-03-20T09:00:00"),
      },
      {
        content:   "Looks great! Really clean UI 👍",
        channelId: generalChannel.id,
        senderId:  hrManager.id,
        createdAt: new Date("2026-03-20T09:05:00"),
      },
      {
        content:   "Finally all our tools in one place!",
        channelId: generalChannel.id,
        senderId:  projectManager.id,
        createdAt: new Date("2026-03-20T09:10:00"),
      },
      {
        content:   "The kanban board is working really well",
        channelId: generalChannel.id,
        senderId:  dev1.id,
        createdAt: new Date("2026-03-20T09:15:00"),
      },
      {
        content:   "Authentication PR is ready for review",
        channelId: devChannel.id,
        senderId:  dev2.id,
        createdAt: new Date("2026-03-20T10:00:00"),
      },
      {
        content:   "Will review it after standup",
        channelId: devChannel.id,
        senderId:  projectManager.id,
        createdAt: new Date("2026-03-20T10:05:00"),
      },
      {
        content:   "Dashboard wireframes are ready. Sharing in files section.",
        channelId: designChannel.id,
        senderId:  designer.id,
        createdAt: new Date("2026-03-20T11:00:00"),
      },
    ]
  });

  console.log("✅ Channels and messages created");

  // ─── NOTIFICATIONS ────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId:  dev1.id,
        title:   "Task Assigned",
        message: "You have been assigned: Build Kanban board UI",
        type:    "TASK",
        isRead:  true,
      },
      {
        userId:  dev1.id,
        title:   "Task Assigned",
        message: "You have been assigned: Implement real time chat",
        type:    "TASK",
        isRead:  false,
      },
      {
        userId:  dev1.id,
        title:   "Leave Approved",
        message: "Your casual leave request has been approved.",
        type:    "LEAVE",
        isRead:  false,
      },
      {
        userId:  dev2.id,
        title:   "Task Assigned",
        message: "You have been assigned: Setup authentication system",
        type:    "TASK",
        isRead:  true,
      },
      {
        userId:  dev2.id,
        title:   "Leave Pending",
        message: "Your sick leave request is pending approval.",
        type:    "LEAVE",
        isRead:  false,
      },
      {
        userId:  designer.id,
        title:   "Leave Rejected",
        message: "Your earned leave request has been rejected. Note: Project deadline conflicts.",
        type:    "LEAVE",
        isRead:  false,
      },
      {
        userId:  projectManager.id,
        title:   "Leave Request",
        message: "Rahul Verma has applied for sick leave. Please review.",
        type:    "LEAVE",
        isRead:  false,
      },
      {
        userId:  superAdmin.id,
        title:   "Welcome to Desk",
        message: "Your Desk workspace is ready. Start by adding your team members.",
        type:    "SYSTEM",
        isRead:  true,
      },
    ]
  });

  console.log("✅ Notifications created");

  // ─── SUMMARY ──────────────────────────────────────
  console.log("\n✅ Database seeded successfully!");
  console.log("\n📋 Login Credentials (all passwords: Admin@123)");
  console.log("┌─────────────────────────────────────────────┐");
  console.log("│ Role         │ Email                        │");
  console.log("├─────────────────────────────────────────────┤");
  console.log("│ SUPER_ADMIN  │ superadmin@desk.com          │");
  console.log("│ ADMIN (HR)   │ hr@desk.com                  │");
  console.log("│ MANAGER      │ amit@desk.com                │");
  console.log("│ EMPLOYEE     │ priya@desk.com               │");
  console.log("│ EMPLOYEE     │ rahul@desk.com               │");
  console.log("│ EMPLOYEE     │ sneha@desk.com               │");
  console.log("└─────────────────────────────────────────────┘");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });