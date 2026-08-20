-- CreateTable
CREATE TABLE "sectors" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bounds_min" DOUBLE PRECISION[],
    "bounds_max" DOUBLE PRECISION[],
    "track_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
