/*
  Warnings:

  - You are about to drop the column `action` on the `token_cost_config` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `token_cost_config` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[duration_unit]` on the table `token_cost_config` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cost_per_unit` to the `token_cost_config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration_unit` to the `token_cost_config` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "token_cost_config_action_key";

-- AlterTable
ALTER TABLE "token_cost_config" DROP COLUMN "action",
DROP COLUMN "cost",
ADD COLUMN     "cost_per_unit" INTEGER NOT NULL,
ADD COLUMN     "duration_unit" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "token_cost_config_duration_unit_key" ON "token_cost_config"("duration_unit");
