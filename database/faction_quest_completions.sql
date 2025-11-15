-- Table untuk mencatat quest yang sudah diselesaikan oleh faction
-- Setiap quest completion akan dicatat dengan tier quest dan timestamp

CREATE TABLE IF NOT EXISTS `faction_quest_completions` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `FactionId` varchar(50) NOT NULL,
  `QuestId` varchar(100) NOT NULL,
  `QuestName` varchar(255) DEFAULT NULL,
  `QuestTier` int(11) NOT NULL DEFAULT 1,
  `CompletedBy` bigint(20) unsigned DEFAULT NULL COMMENT 'SteamID player yang menyelesaikan quest',
  `CompletedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `PointsEarned` int(11) DEFAULT 0,
  PRIMARY KEY (`Id`),
  KEY `idx_faction_id` (`FactionId`),
  KEY `idx_quest_id` (`QuestId`),
  KEY `idx_quest_tier` (`QuestTier`),
  KEY `idx_completed_at` (`CompletedAt`),
  CONSTRAINT `fk_faction_quest_faction` FOREIGN KEY (`FactionId`) REFERENCES `factions` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Index untuk query stats per tier
CREATE INDEX `idx_faction_tier` ON `faction_quest_completions` (`FactionId`, `QuestTier`);

