-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "taste_vector" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "vector_updated_at" TIMESTAMP(3),
    "coord_x" DOUBLE PRECISION,
    "coord_y" DOUBLE PRECISION,
    "coord_z" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "mbid" TEXT,
    "cover_url" TEXT,
    "genre_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "song_vector" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "coord_x" DOUBLE PRECISION,
    "coord_y" DOUBLE PRECISION,
    "coord_z" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_songs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "song_id" TEXT NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "emotion_tags" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_relations" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "similarity_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "satellites" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "song_id" TEXT NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "satellites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "songs_mbid_key" ON "songs"("mbid");

-- CreateIndex
CREATE UNIQUE INDEX "user_songs_user_id_song_id_key" ON "user_songs"("user_id", "song_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_relations_follower_id_following_id_key" ON "social_relations"("follower_id", "following_id");

-- AddForeignKey
ALTER TABLE "user_songs" ADD CONSTRAINT "user_songs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_songs" ADD CONSTRAINT "user_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_relations" ADD CONSTRAINT "social_relations_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_relations" ADD CONSTRAINT "social_relations_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "satellites" ADD CONSTRAINT "satellites_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "satellites" ADD CONSTRAINT "satellites_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
