/*
  Warnings:

  - You are about to drop the `social_relations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "social_relations" DROP CONSTRAINT "social_relations_follower_id_fkey";

-- DropForeignKey
ALTER TABLE "social_relations" DROP CONSTRAINT "social_relations_following_id_fkey";

-- DropTable
DROP TABLE "social_relations";
