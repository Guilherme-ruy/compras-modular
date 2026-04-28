-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "contacts" JSONB NOT NULL DEFAULT '[]';
