/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - Added the required column `date` to the `Lecture` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hostId` to the `Lecture` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructor` to the `Lecture` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Lecture` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Registration` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lecture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "currentRegistrations" INTEGER NOT NULL DEFAULT 0,
    "hostId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lecture_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Lecture" ("capacity", "id", "title") SELECT "capacity", "id", "title" FROM "Lecture";
DROP TABLE "Lecture";
ALTER TABLE "new_Lecture" RENAME TO "Lecture";
CREATE INDEX "Lecture_date_idx" ON "Lecture"("date");
CREATE TABLE "new_Registration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lectureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Registration_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "Lecture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Registration" ("createdAt", "lectureId", "userId") SELECT "createdAt", "lectureId", "userId" FROM "Registration";
DROP TABLE "Registration";
ALTER TABLE "new_Registration" RENAME TO "Registration";
CREATE INDEX "Registration_lectureId_userId_idx" ON "Registration"("lectureId", "userId");
CREATE UNIQUE INDEX "Registration_userId_lectureId_key" ON "Registration"("userId", "lectureId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("id", "name") SELECT "id", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
