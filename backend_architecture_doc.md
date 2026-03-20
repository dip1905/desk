# Desk Backend Architecture & Workflow Documentation
**Prepared for Interview Review**

This document provides a comprehensive overview of the `Desk` backend project. It covers the core technologies used, database schema design, application structure, security practices, and request lifecycle.

---

## 1. Tech Stack Overview

The `Desk` backend is built using a modern, robust Node.js stack:
-   **Runtime:** Node.js
-   **Framework:** Express.js (`^5.2.1`)
-   **Database ORM:** Prisma (`^5.22.0`)
-   **Database:** PostgreSQL (implied by Prisma `datasource` config)
-   **Authentication:** JSON Web Tokens (JWT) & bcryptjs for password hashing.
-   **File Storage:** Cloudinary (`^2.9.0`) integrated with Multer.
-   **Email Service:** SendGrid (`@sendgrid/mail`) - *Dependency present, implementation likely in unreviewed modules.*
-   **Real-time Communication:** Socket.io (`^4.8.3`) - *Initialized, folders present, exact events pending.*
-   **Validation:** Zod (`^4.3.6`) for strict runtime request schema validation.

---

## 2. Project Structure Breakdown

The codebase follows a standard, modular Express architecture:

```text
Desk/server/
├── prisma/
│   └── schema.prisma        # Database schema and models definition
├── src/
│   ├── config/              # Centralized configuration (db.js, cloudinary.js)
│   ├── middleware/          # Custom global and route-specific middleware
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── role.middleware.js
│   ├── modules/             # Feature-based modular routing and controllers
│   │   ├── auth/            # Authentication logic (register, login, profile, etc.)
│   │   ├── analytics/       # (Dashboards, stats)
│   │   ├── chat/            # (Messaging routes)
│   │   ├── files/           # (Cloudinary upload handlers)
│   │   ├── hr/              # (Leave, Attendance management)
│   │   ├── notifications/
│   │   ├── projects/        # (Project CRUD)
│   │   └── tasks/           # (Task CRUD, assignment)
│   ├── socket/              # Real-time event handlers
│   ├── utils/               # Reusable helper functions
│   └── index.js             # Main application entry point & Express setup
├── .env                     # Environment variables
└── package.json             # Dependencies and scripts -> `npm run dev`
```

---

## 3. Database Schema (Prisma)

The application models a collaborative workspace/HR system. Here are the core entities and their relationships:

1.  **User (`model User`)**
    -   Central authentication entity.
    -   Attributes: `id`, `name`, `email`, `password`, `role` (Enum: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `EMPLOYEE`), `avatar`, `isActive`.
    -   Relations: Has one `Employee` profile. Has many `Task` (assigned/created), `ProjectMember`, `ChannelMember`, `Message`, `Notification`, `FileStore`.

2.  **HR & Identity (`model Employee`, `Leave`, `Attendance`)**
    -   `Employee`: Extends `User` with HR details (`department`, `designation`, `salary`, `leaveBalance`).
    -   `Leave` & `Attendance`: Track time off and daily punch-ins linked to specific `Employee` records.

3.  **Project Management (`model Project`, `Task`, `Comment`, `ActivityLog`)**
    -   `Project`: High-level containers with `status` (Enum: `PLANNING`, `ACTIVE`, etc.) and `members` (junction table `ProjectMember`).
    -   `Task`: Belongs to a Project. Has `status` (Enum: `TODO`, `IN_PROGRESS`, `DONE`), `priority`, and is assigned to a User.
    -   `ActivityLog`: Audit trail for actions taken on tasks.

4.  **Communication & Chat (`model Channel`, `ChannelMember`, `Message`)**
    -   Supports private channels and direct messages (using `senderId` and `receiverId`/`channelId`).

**Key Database Design Decisions:**
-   **`onDelete: Cascade`**: Heavily used. Deleting a user deletes their employee profile, leaves, attendance, and project memberships. Deleting a channel deletes its messages. This maintains referential integrity automatically.
-   **UUIDs**: All primary keys (`id`) use UUIDs for secure, distributed ID generation.
-   **Enums**: Native PostgreSQL enums are used extensively for Roles, Departments, and Statuses to enforce data consistency at the database level.

---

## 4. Application Workflow & Request Lifecycle

### A. Server Initialization ([src/index.js](file:///e:/ReactProject/Desk/server/src/index.js))
1.  **Environment Load:** Reads [.env](file:///e:/ReactProject/Desk/server/.env) using `dotenv`.
2.  **Database Connection:** Requires [src/config/db.js](file:///e:/ReactProject/Desk/server/src/config/db.js) which initializes the Prisma Client.
3.  **Express App Setup:** Initializes Express and wraps it in a Node `http.Server` (necessary for Socket.io).
4.  **Global Middleware:**
    -   `cors`: Configured to accept requests from `process.env.CLIENT_URL` with `credentials: true` (important for cookies if used later).
    -   `express.json()`: Parses incoming JSON payloads.
    -   `morgan("dev")`: Logs HTTP requests to the console.
    -   `cookie-parser`: Middleware ready for securely parsing JWTs stored in HTTP-only cookies (though currently, the Auth module uses Bearer tokens).
5.  **Routing:** Mounts feature modules router under `/api/*` prefixes (e.g., `/api/auth`).
6.  **Error Handling:** The `errorMiddleware` is mounted *last* to catch any unhandled errors or explicitly forwarded errors via `next(error)`.

### B. Security & Authentication Workflow (`src/modules/auth`)
The auth flow implements a specific **"First User Setup"** pattern.

1.  **Initial Setup Check (`/api/auth/check-setup`)**: Returns whether there are currently *zero* users in the database.
2.  **Registration (`/api/auth/register`)**:
    -   **Validation:** Uses Zod to ensure valid email, password length, and allowed roles.
    -   **Logic:**
        -   If `userCount === 0`, creates the user immediately and hardcodes their role to `SUPER_ADMIN`.
        -   If `userCount > 0`, it enforces that only a logged-in user with an `ADMIN` or `SUPER_ADMIN` role can hit this endpoint to create new employee accounts.
    -   **Password Hashing:** Uses `bcrypt.hash()` before saving to Prisma.
3.  **Login (`/api/auth/login`)**:
    -   Validates credentials.
    -   Crucially checks `if (!user.isActive)` to prevent disabled employees from logging in.
    -   Generates a JWT signed with `id` payload using `process.env.JWT_SECRET`.
4.  **Token Validation (`src/middleware/auth.middleware.js`)**:
    -   The `protect` middleware extracts the token from the `Authorization: Bearer <token>` header.
    -   Verifies the token via `jwt.verify`.
    -   Fetches the user from the database.
    -   Verifies the user hasn't been deleted (`!user`) AND verifies the user hasn't been deactivated (`!user.isActive`) *since* the token was issued.
    -   Attaches the user object to `req.user` and calls `next()`.

---

## 5. What You Have Done (The "Narrative")

If describing this project in an interview, frame your contribution or the project's state as follows:

1.  **Architected a Modular Monolith:** "I structured the backend using a modular pattern around distinct business domains (Auth, HR, Projects, Chat). This keeps controllers and routes isolated, making the codebase easier to scale and maintain as the team grows."
2.  **Designed a Robust Relational Schema:** "I designed the PostgreSQL schema using Prisma. I focused heavily on referential integrity utilizing Cascading deletes, and normalized the data by separating core `User` authentication identities from `Employee` HR profiles while linking them 1-to-1."
3.  **Implemented Secure Identity Management:** "I built the auth flow from scratch. It features a unique bootstrapping mechanism where the very first user registered becomes the `SUPER_ADMIN`. After that, registration is locked down—only Admins can provision new employee accounts. Passwords are bcrypt hashed, and active sessions are secured via JWT bearer tokens verified by custom middleware on every protected route."
4.  **Enforced Strict Type Validation:** "To prevent bad data from reaching the database, I integrated `Zod` at the controller level. Every incoming request payload (like login or registration) is schema-validated before it hits any business logic."
5.  **Set the Foundation for Real-time & Media:** "I have provisioned the infrastructure for real-time features using `Socket.io` attached to the main HTTP server, and integrated `Cloudinary` and `Multer` for future-proof file storage capabilities."

---

## 6. Potential Interview Questions to Prepare For based on this code:
*   *Why did you choose Prisma over an ORM like Sequelize or raw SQL queries?*
*   *How do you handle the risk of JWTs being stolen, given you are currently mostly relying on Bearer tokens instead of HTTP-only cookies?*
*   *Explain the difference between `User` and `Employee` in your database schema. Why not just put everything in one big `User` table?*
*   *How does your global error handler work in Express, and why must it be defined last?*
*   *In your `register` controller, how do you prevent a regular employee from using an API tool (like Postman) to send a request to create another ADMIN account?* (Answer: the auth logic explicitly verifies the token of the requester and their role).
