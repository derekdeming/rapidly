-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('START', 'END');

-- CreateEnum
CREATE TYPE "Code" AS ENUM ('SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "ref_doc_id" TEXT;

-- CreateTable
CREATE TABLE "WaitlistSignup" (
    "email" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "data_vector_store" (
    "id" BIGSERIAL NOT NULL,
    "text" VARCHAR NOT NULL,
    "metadata_" JSON,
    "node_id" VARCHAR,
    "embedding" vector,

    CONSTRAINT "data_vector_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'START',
    "code" "Code",
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistSignup_email_key" ON "WaitlistSignup"("email");
