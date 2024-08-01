-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Guest', 'Member', 'RaidLead', 'GuildLead', 'Admin');

-- CreateEnum
CREATE TYPE "CharacterClass" AS ENUM ('Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest', 'Shaman', 'Mage', 'Warlock', 'Monk', 'Druid', 'DemonHunter', 'DeathKnight', 'Evoker');

-- CreateEnum
CREATE TYPE "CharacterRole" AS ENUM ('Tank', 'Healer', 'Damage');

-- CreateEnum
CREATE TYPE "ListType" AS ENUM ('SuicideKing', 'TSet');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'Guest',
    "currentHashedRefreshToken" TEXT,
    "hashedPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class" "CharacterClass" NOT NULL,
    "roles" "CharacterRole"[],

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaidContribution" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "RaidContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuicideKingList" (
    "characterId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER,
    "tSetPosition" INTEGER,

    CONSTRAINT "SuicideKingList_pkey" PRIMARY KEY ("characterId")
);

-- CreateTable
CREATE TABLE "SuicideKingListHistory" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "listType" "ListType" NOT NULL,
    "from" INTEGER,
    "to" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "item" TEXT,

    CONSTRAINT "SuicideKingListHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "RaidContribution" ADD CONSTRAINT "RaidContribution_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuicideKingList" ADD CONSTRAINT "SuicideKingList_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuicideKingListHistory" ADD CONSTRAINT "SuicideKingListHistory_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
