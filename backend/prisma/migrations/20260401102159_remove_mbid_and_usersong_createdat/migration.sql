/*
  Warnings:

  - You are about to drop the column `mbid` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `user_songs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "songs_mbid_key";

-- AlterTable
ALTER TABLE "songs" DROP COLUMN "mbid";

-- AlterTable
ALTER TABLE "user_songs" DROP COLUMN "created_at";
