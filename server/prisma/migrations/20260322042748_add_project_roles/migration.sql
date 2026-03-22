-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('COORDINATOR', 'TEAM_LEAD', 'DEVELOPER', 'DESIGNER', 'TESTER', 'MEMBER');

-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "projectRole" "ProjectRole" NOT NULL DEFAULT 'MEMBER';
