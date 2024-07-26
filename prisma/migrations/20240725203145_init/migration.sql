-- CreateEnum
CREATE TYPE "Class" AS ENUM ('Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest', 'Shaman', 'Mage', 'Warlock', 'Monk', 'Druid', 'DemonHunter', 'DeathKnight', 'Evoker');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Tank', 'Healer', 'Damage');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentHashedRefreshToken" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class" "Class" NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaidContribution" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "RaidContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuicideKingList" (
    "characterId" TEXT NOT NULL,
    "rank" INTEGER,
    "tSetRank" INTEGER,

    CONSTRAINT "SuicideKingList_pkey" PRIMARY KEY ("characterId")
);

-- CreateTable
CREATE TABLE "SuicideKingListHistory" (
    "characterId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "tSetRank" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "item" TEXT,

    CONSTRAINT "SuicideKingListHistory_pkey" PRIMARY KEY ("characterId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "RaidContribution" ADD CONSTRAINT "RaidContribution_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuicideKingList" ADD CONSTRAINT "SuicideKingList_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuicideKingListHistory" ADD CONSTRAINT "SuicideKingListHistory_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
