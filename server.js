const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection pool
// Uses environment variables with fallback to default values (same as QuestWebManager)
const pool = mysql.createPool({
    host: process.env.DB_HOST || '49.128.184.34',
    port: process.env.DB_PORT || 3406,
    user: process.env.DB_USER || 'u143_8Iv5ZNvRLS',
    password: process.env.DB_PASSWORD || 'uh14Qyd.I.pP@Frog^yLy7kR',
    database: process.env.DB_NAME || 's143_db_unturned',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // IMPORTANT: For bigint unsigned, we need to return as string to preserve precision
    // JavaScript Number can only safely represent integers up to Number.MAX_SAFE_INTEGER (2^53-1)
    // SteamID (76561198152301292) exceeds this, so we need string representation
    // Temporarily disabled to match QuestWebManager config - can be re-enabled if needed
    // supportBigNumbers: true,
    // bigNumberStrings: true
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

// Helper function to execute queries
async function executeQuery(query, params = []) {
    try {
        const [results] = await pool.execute(query, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Routes

// Get all factions
app.get('/api/factions', async (req, res) => {
    try {
        // Get database name from connection
        const [dbInfo] = await pool.execute('SELECT DATABASE() as db');
        const dbName = dbInfo[0].db;
        
        // Check if table exists
        const [tables] = await pool.execute(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'factions'",
            [dbName]
        );
        
        if (tables.length === 0) {
            return res.json({ success: true, data: [], message: 'Factions table does not exist. Please ensure FactionSystem plugin is configured with database.' });
        }
        
        // Check columns
        const [columns] = await pool.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'factions'",
            [dbName]
        );
        
        const columnNames = columns.map(c => c.COLUMN_NAME);
        const hasPrefix = columnNames.includes('Prefix');
        const hasSuffix = columnNames.includes('Suffix');
        const hasChatColor = columnNames.includes('ChatColor');
        const hasColor = columnNames.includes('Color');
        
        // Build query based on available columns
        let selectColumns = 'f.Id, f.Name, f.Tag, f.OwnerId, f.TotalPoints, f.Tier';
        let groupByColumns = 'f.Id, f.Name, f.Tag, f.OwnerId, f.TotalPoints, f.Tier';
        
        if (columnNames.includes('CreatedAt')) {
            selectColumns += ', f.CreatedAt';
            groupByColumns += ', f.CreatedAt';
        }
        if (columnNames.includes('UpdatedAt')) {
            selectColumns += ', f.UpdatedAt';
            groupByColumns += ', f.UpdatedAt';
        }
        if (hasChatColor) {
            selectColumns += ', f.ChatColor';
            groupByColumns += ', f.ChatColor';
        } else if (hasColor) {
            selectColumns += ', f.Color';
            groupByColumns += ', f.Color';
        }
        if (hasPrefix) {
            selectColumns += ', f.Prefix';
            groupByColumns += ', f.Prefix';
        }
        if (hasSuffix) {
            selectColumns += ', f.Suffix';
            groupByColumns += ', f.Suffix';
        }
        
        // Build GROUP BY clause - format properly
        const groupByList = groupByColumns.split(',').map(col => col.trim()).join(', ');
        
        const query = `
            SELECT 
                ${selectColumns},
                COUNT(DISTINCT pf.PlayerId) as MemberCount
            FROM factions f
            LEFT JOIN player_factions pf ON f.Id = pf.FactionId
            GROUP BY ${groupByList}
            ORDER BY f.TotalPoints DESC, f.Name ASC
        `;
        
        console.log('Executing query:', query.replace(/\s+/g, ' '));
        console.log('Available columns:', columnNames.join(', '));
        const factions = await executeQuery(query);
        
        // Map Color to ChatColor if ChatColor doesn't exist
        const mappedFactions = factions.map(f => {
            // Map Color to ChatColor for consistency
            if (!hasChatColor && hasColor && f.Color) {
                f.ChatColor = f.Color;
            } else if (!hasChatColor && !hasColor) {
                f.ChatColor = 'cyan'; // default
            }
            // Set default values for Prefix and Suffix if they don't exist
            if (!hasPrefix) f.Prefix = '';
            if (!hasSuffix) f.Suffix = '';
            return f;
        });
        
        console.log(`✅ Loaded ${mappedFactions.length} factions from database`);
        res.json({ success: true, data: mappedFactions });
    } catch (error) {
        console.error('Error fetching factions:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Get faction by ID with full details
app.get('/api/factions/:id', async (req, res) => {
    try {
        // Get database name and check columns
        const [dbInfo] = await pool.execute('SELECT DATABASE() as db');
        const dbName = dbInfo[0].db;
        
        const [columns] = await pool.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'factions'",
            [dbName]
        );
        const columnNames = columns.map(c => c.COLUMN_NAME);
        const hasChatColor = columnNames.includes('ChatColor');
        const hasColor = columnNames.includes('Color');
        const hasPrefix = columnNames.includes('Prefix');
        const hasSuffix = columnNames.includes('Suffix');
        
        // Build SELECT query
        let selectColumns = 'Id, Name, Tag, OwnerId, TotalPoints, Tier';
        if (hasChatColor) selectColumns += ', ChatColor';
        else if (hasColor) selectColumns += ', Color as ChatColor';
        if (hasPrefix) selectColumns += ', Prefix';
        if (hasSuffix) selectColumns += ', Suffix';
        if (columnNames.includes('CreatedAt')) selectColumns += ', CreatedAt';
        if (columnNames.includes('UpdatedAt')) selectColumns += ', UpdatedAt';
        
        const [factions] = await pool.execute(
            `SELECT ${selectColumns} FROM factions WHERE Id = ?`,
            [req.params.id]
        );

        if (factions.length === 0) {
            return res.status(404).json({ success: false, error: 'Faction not found' });
        }

        const faction = factions[0];
        
        // Map Color to ChatColor if needed
        if (!hasChatColor && hasColor && faction.ChatColor === undefined && faction.Color) {
            faction.ChatColor = faction.Color;
        } else if (!hasChatColor && !hasColor) {
            faction.ChatColor = 'cyan';
        }
        if (!hasPrefix) faction.Prefix = '';
        if (!hasSuffix) faction.Suffix = '';

        // Get members with stats
        const [pfColumns] = await pool.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'player_factions'",
            [dbName]
        );
        const pfColumnNames = pfColumns.map(c => c.COLUMN_NAME);
        const hasIsLeader = pfColumnNames.includes('IsLeader');
        
        // Check if player_stats table exists
        const [statsTables] = await pool.execute(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'player_stats'",
            [dbName]
        );
        const hasStatsTable = statsTables.length > 0;
        
        let membersQuery;
        // IMPORTANT: Use CAST to ensure PlayerId is returned as string to preserve precision
        // This prevents precision loss for bigint unsigned values
        if (hasIsLeader && hasStatsTable) {
            membersQuery = `
                SELECT 
                    CAST(pf.PlayerId AS CHAR) as PlayerId,
                    pf.IsLeader,
                    COALESCE(ps.XPDonated, 0) as XPDonated
                FROM player_factions pf
                LEFT JOIN player_stats ps ON pf.PlayerId = ps.PlayerId
                WHERE pf.FactionId = ?
                ORDER BY pf.IsLeader DESC, ps.XPDonated DESC
            `;
        } else if (hasStatsTable) {
            membersQuery = `
                SELECT 
                    CAST(pf.PlayerId AS CHAR) as PlayerId,
                    0 as IsLeader,
                    COALESCE(ps.XPDonated, 0) as XPDonated
                FROM player_factions pf
                LEFT JOIN player_stats ps ON pf.PlayerId = ps.PlayerId
                WHERE pf.FactionId = ?
                ORDER BY ps.XPDonated DESC
            `;
        } else if (hasIsLeader) {
            membersQuery = `
                SELECT 
                    CAST(pf.PlayerId AS CHAR) as PlayerId,
                    pf.IsLeader,
                    0 as XPDonated
                FROM player_factions pf
                WHERE pf.FactionId = ?
                ORDER BY pf.IsLeader DESC
            `;
        } else {
            membersQuery = `
                SELECT 
                    CAST(pf.PlayerId AS CHAR) as PlayerId,
                    0 as IsLeader,
                    0 as XPDonated
                FROM player_factions pf
                WHERE pf.FactionId = ?
            `;
        }
        
        const [members] = await pool.execute(membersQuery, [req.params.id]);
        
        // Normalize PlayerId format - ensure it's consistent string format
        // PlayerId should already be string from CAST(PlayerId AS CHAR)
        // But we double-check to ensure no precision loss
        members.forEach(member => {
            if (member.PlayerId !== null && member.PlayerId !== undefined) {
                // PlayerId should already be string from CAST, but ensure it's string
                // to prevent any precision loss
                let playerId = member.PlayerId;
                
                // If it's already a string (from CAST), use it directly
                if (typeof playerId === 'string') {
                    playerId = playerId.trim();
                } else {
                    // If somehow it's not a string, convert it
                    // This should not happen with CAST, but safety check
                    playerId = String(playerId).trim();
                    console.warn(`[FactionDetails] PlayerId was not string! Type: ${typeof member.PlayerId}, Value: ${member.PlayerId}, Converted: ${playerId}`);
                }
                
                // Ensure no leading/trailing whitespace
                member.PlayerId = playerId;
                
                console.log(`[FactionDetails] PlayerId: ${member.PlayerId} (type: ${typeof member.PlayerId})`);
            }
        });
        
        // Get member count
        const memberCount = members.length;
        
        // Calculate total XP from members
        const totalXPDonated = members.reduce((sum, m) => sum + (parseInt(m.XPDonated) || 0), 0);
        
        // Check if owner is in members
        const owner = members.find(m => m.PlayerId == faction.OwnerId);
        if (!owner && faction.OwnerId) {
            // Owner might not be in player_factions, add them
            members.unshift({
                PlayerId: faction.OwnerId,
                IsLeader: 1,
                XPDonated: 0
            });
        }

        res.json({
            success: true,
            data: {
                ...faction,
                Members: members,
                MemberCount: memberCount,
                TotalXPDonated: totalXPDonated,
                Owner: owner || (faction.OwnerId ? {
                    PlayerId: faction.OwnerId,
                    IsLeader: 1,
                    XPDonated: 0
                } : null)
            }
        });
    } catch (error) {
        console.error('Error fetching faction:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Create faction
app.post('/api/factions', async (req, res) => {
    try {
        const {
            Id,
            Name,
            Tag = '',
            Prefix = '',
            Suffix = '',
            ChatColor = 'cyan',
            OwnerId
        } = req.body;

        if (!Id || !Name || !OwnerId) {
            return res.status(400).json({ success: false, error: 'Id, Name, and OwnerId are required' });
        }

        // Check if faction ID already exists
        const [existing] = await pool.execute(
            'SELECT Id FROM factions WHERE Id = ?',
            [Id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Faction ID already exists' });
        }

        // Check which columns exist
        const [columns] = await pool.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'factions'"
        );
        const columnNames = columns.map(c => c.COLUMN_NAME);
        const hasPrefix = columnNames.includes('Prefix');
        const hasSuffix = columnNames.includes('Suffix');
        const hasChatColor = columnNames.includes('ChatColor');
        const hasColor = columnNames.includes('Color');
        const hasCreatedAt = columnNames.includes('CreatedAt');
        const hasUpdatedAt = columnNames.includes('UpdatedAt');
        
        // Build INSERT query based on available columns
        let insertColumns = 'Id, Name, Tag, OwnerId, TotalPoints, Tier';
        let insertValues = '?, ?, ?, ?, 0, 1';
        let insertParams = [Id, Name, Tag || '', OwnerId];
        
        if (hasCreatedAt) {
            insertColumns += ', CreatedAt';
            insertValues += ', CURRENT_TIMESTAMP';
        }
        if (hasUpdatedAt) {
            insertColumns += ', UpdatedAt';
            insertValues += ', CURRENT_TIMESTAMP';
        }
        
        // Handle color column (ChatColor or Color)
        if (hasChatColor) {
            insertColumns += ', ChatColor';
            insertValues += ', ?';
            insertParams.push(ChatColor || 'cyan');
        } else if (hasColor) {
            insertColumns += ', Color';
            insertValues += ', ?';
            insertParams.push(ChatColor || 'cyan');
        }
        
        if (hasPrefix) {
            insertColumns += ', Prefix';
            insertValues += ', ?';
            insertParams.push(Prefix || '');
        }
        
        if (hasSuffix) {
            insertColumns += ', Suffix';
            insertValues += ', ?';
            insertParams.push(Suffix || '');
        }

        const [result] = await pool.execute(
            `INSERT INTO factions (${insertColumns}) VALUES (${insertValues})`,
            insertParams
        );

        // Add owner as member (check if IsLeader column exists)
        const [pfColumns] = await pool.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'player_factions'"
        );
        const pfColumnNames = pfColumns.map(c => c.COLUMN_NAME);
        const hasIsLeader = pfColumnNames.includes('IsLeader');
        
        if (hasIsLeader) {
            await pool.execute(
                'INSERT INTO player_factions (PlayerId, FactionId, IsLeader) VALUES (?, ?, 1)',
                [OwnerId, Id]
            );
        } else {
            await pool.execute(
                'INSERT INTO player_factions (PlayerId, FactionId) VALUES (?, ?)',
                [OwnerId, Id]
            );
        }

        res.json({
            success: true,
            message: 'Faction created successfully',
            data: { Id, ...req.body }
        });
    } catch (error) {
        console.error('Error creating faction:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Update faction
app.put('/api/factions/:id', async (req, res) => {
    try {
        const factionId = req.params.id;
        const {
            Name,
            Tag,
            Prefix,
            Suffix,
            ChatColor
        } = req.body;

        // Check which columns exist
        const [columns] = await pool.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'factions'"
        );
        const columnNames = columns.map(c => c.COLUMN_NAME);
        const hasPrefix = columnNames.includes('Prefix');
        const hasSuffix = columnNames.includes('Suffix');
        const hasChatColor = columnNames.includes('ChatColor');
        const hasColor = columnNames.includes('Color');
        
        // Build UPDATE query based on available columns
        let updateFields = ['Name = ?', 'Tag = ?', 'UpdatedAt = CURRENT_TIMESTAMP'];
        let updateParams = [Name, Tag || ''];
        
        if (hasPrefix) {
            updateFields.push('Prefix = ?');
            updateParams.push(Prefix || '');
        }
        
        if (hasSuffix) {
            updateFields.push('Suffix = ?');
            updateParams.push(Suffix || '');
        }
        
        if (hasChatColor) {
            updateFields.push('ChatColor = ?');
            updateParams.push(ChatColor || 'cyan');
        } else if (hasColor) {
            updateFields.push('Color = ?');
            updateParams.push(ChatColor || 'cyan');
        }
        
        updateParams.push(factionId);

        const [result] = await pool.execute(
            `UPDATE factions SET ${updateFields.join(', ')} WHERE Id = ?`,
            updateParams
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Faction not found' });
        }

        res.json({
            success: true,
            message: 'Faction updated successfully'
        });
    } catch (error) {
        console.error('Error updating faction:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Delete faction
app.delete('/api/factions/:id', async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM factions WHERE Id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Faction not found' });
        }

        res.json({
            success: true,
            message: 'Faction deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting faction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        // Get database name and check columns (same as /api/factions)
        const [dbInfo] = await pool.execute('SELECT DATABASE() as db');
        const dbName = dbInfo[0].db;
        
        const [columns] = await pool.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'factions'",
            [dbName]
        );
        const columnNames = columns.map(c => c.COLUMN_NAME);
        const hasChatColor = columnNames.includes('ChatColor');
        const hasColor = columnNames.includes('Color');
        
        // Build query same as /api/factions but with limit/offset
        let selectColumns = 'f.Id, f.Name, f.Tag, f.OwnerId, f.TotalPoints, f.Tier';
        let groupByColumns = 'f.Id, f.Name, f.Tag, f.OwnerId, f.TotalPoints, f.Tier';
        
        if (columnNames.includes('CreatedAt')) {
            selectColumns += ', f.CreatedAt';
            groupByColumns += ', f.CreatedAt';
        }
        if (columnNames.includes('UpdatedAt')) {
            selectColumns += ', f.UpdatedAt';
            groupByColumns += ', f.UpdatedAt';
        }
        if (hasChatColor) {
            selectColumns += ', f.ChatColor';
            groupByColumns += ', f.ChatColor';
        } else if (hasColor) {
            selectColumns += ', f.Color as ChatColor';
            groupByColumns += ', f.Color';
        }
        if (columnNames.includes('Prefix')) {
            selectColumns += ', f.Prefix';
            groupByColumns += ', f.Prefix';
        }
        if (columnNames.includes('Suffix')) {
            selectColumns += ', f.Suffix';
            groupByColumns += ', f.Suffix';
        }
        
        const groupByList = groupByColumns.split(',').map(col => col.trim()).join(', ');

        const factions = await executeQuery(`
            SELECT 
                ${selectColumns},
                COUNT(DISTINCT pf.PlayerId) as MemberCount
            FROM factions f
            LEFT JOIN player_factions pf ON f.Id = pf.FactionId
            GROUP BY ${groupByList}
            ORDER BY f.TotalPoints DESC, f.Name ASC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        // Map Color to ChatColor if needed
        const mappedFactions = factions.map(f => {
            if (!hasChatColor && hasColor && f.ChatColor === undefined && f.Color) {
                f.ChatColor = f.Color;
            } else if (!hasChatColor && !hasColor) {
                f.ChatColor = 'cyan';
            }
            return f;
        });

        const [total] = await executeQuery('SELECT COUNT(*) as count FROM factions');

        res.json({
            success: true,
            data: mappedFactions,
            total: total[0].count || 0,
            limit,
            offset
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Get faction members
app.get('/api/factions/:id/members', async (req, res) => {
    try {
        // Check if IsLeader column exists
        const [columns] = await pool.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'player_factions'"
        );
        const columnNames = columns.map(c => c.COLUMN_NAME);
        const hasIsLeader = columnNames.includes('IsLeader');
        
        let query;
        // IMPORTANT: Use CAST to ensure PlayerId is returned as string
        if (hasIsLeader) {
            query = `SELECT 
                CAST(pf.PlayerId AS CHAR) as PlayerId,
                pf.IsLeader,
                COALESCE(ps.XPDonated, 0) as XPDonated
            FROM player_factions pf
            LEFT JOIN player_stats ps ON pf.PlayerId = ps.PlayerId
            WHERE pf.FactionId = ?
            ORDER BY pf.IsLeader DESC, ps.XPDonated DESC`;
        } else {
            query = `SELECT 
                CAST(pf.PlayerId AS CHAR) as PlayerId,
                0 as IsLeader,
                COALESCE(ps.XPDonated, 0) as XPDonated
            FROM player_factions pf
            LEFT JOIN player_stats ps ON pf.PlayerId = ps.PlayerId
            WHERE pf.FactionId = ?
            ORDER BY ps.XPDonated DESC`;
        }
        
        const [members] = await pool.execute(query, [req.params.id]);
        
        // Ensure all PlayerIds are strings (should already be with CAST)
        members.forEach(member => {
            if (member.PlayerId) {
                member.PlayerId = String(member.PlayerId);
            }
        });

        res.json({ success: true, data: members });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const [totalFactions] = await executeQuery('SELECT COUNT(*) as total FROM factions');
        const [totalPlayers] = await executeQuery('SELECT COUNT(DISTINCT PlayerId) as total FROM player_factions WHERE FactionId IS NOT NULL');
        
        // Check if player_stats table exists
        let totalXP = 0;
        let tierStats = [];
        
        try {
            const [totalXPResult] = await executeQuery('SELECT SUM(XPDonated) as total FROM player_stats');
            totalXP = totalXPResult[0]?.total || 0;
        } catch (e) {
            console.warn('player_stats table does not exist or error:', e.message);
        }
        
        try {
            tierStats = await executeQuery(`
                SELECT Tier, COUNT(*) as count 
                FROM factions 
                GROUP BY Tier 
                ORDER BY Tier
            `);
        } catch (e) {
            console.warn('Error fetching tier stats:', e.message);
        }

        res.json({
            success: true,
            data: {
                totalFactions: totalFactions[0].total || 0,
                totalPlayers: totalPlayers[0].total || 0,
                totalXP: totalXP,
                tierStats: tierStats
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const [result] = await pool.execute('SELECT 1 as health');
        res.json({ success: true, health: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ success: false, health: 'error', error: error.message });
    }
});

// Get all player stats
app.get('/api/playerstats', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const sortBy = req.query.sortBy || 'Kills';
        const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
        const search = req.query.search || '';

        // Check if PlayerStatsNew table exists
        const [dbInfo] = await pool.execute('SELECT DATABASE() as db');
        const dbName = dbInfo[0].db;
        
        const [tables] = await pool.execute(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'PlayerStatsNew'",
            [dbName]
        );
        
        if (tables.length === 0) {
            return res.json({ 
                success: true, 
                data: [], 
                total: 0,
                message: 'PlayerStatsNew table does not exist.' 
            });
        }

        // Validate sortBy column
        const validSortColumns = [
            'SteamId', 'Name', 'Kills', 'Headshots', 'PVPDeaths', 'PVEDeaths',
            'Zombies', 'MegaZombies', 'Animals', 'Resources', 'Harvests',
            'Fish', 'Structures', 'Barricades', 'Playtime', 'LastUpdated'
        ];
        const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'Kills';

        // Build query
        let whereClause = '';
        let queryParams = [];
        
        if (search) {
            whereClause = 'WHERE Name LIKE ? OR SteamId LIKE ?';
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern);
        }

        const query = `
            SELECT 
                CAST(SteamId AS CHAR) as SteamId,
                Name,
                Kills,
                Headshots,
                PVPDeaths,
                PVEDeaths,
                Zombies,
                MegaZombies,
                Animals,
                Resources,
                Harvests,
                Fish,
                Structures,
                Barricades,
                Playtime,
                UIDisabled,
                LastUpdated
            FROM PlayerStatsNew
            ${whereClause}
            ORDER BY ${safeSortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;

        queryParams.push(limit, offset);

        const [stats] = await pool.execute(query, queryParams);
        
        // Ensure all SteamIds are strings (should already be with CAST, but double-check)
        stats.forEach(stat => {
            if (stat.SteamId) {
                stat.SteamId = String(stat.SteamId);
            }
        });

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM PlayerStatsNew';
        let countParams = [];
        if (search) {
            countQuery += ' WHERE Name LIKE ? OR SteamId LIKE ?';
            const searchPattern = `%${search}%`;
            countParams.push(searchPattern, searchPattern);
        }
        const [totalResult] = await pool.execute(countQuery, countParams);
        const total = totalResult[0].total || 0;

        res.json({
            success: true,
            data: stats,
            total: total,
            limit: limit,
            offset: offset,
            sortBy: safeSortBy,
            sortOrder: sortOrder
        });
    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Get player stats by SteamId
app.get('/api/playerstats/:steamId', async (req, res) => {
    try {
        let steamId = req.params.steamId;

        // Convert to number if it's a string number
        if (typeof steamId === 'string' && /^\d+$/.test(steamId)) {
            steamId = BigInt(steamId);
        }

        // Check if PlayerStatsNew table exists
        const [dbInfo] = await pool.execute('SELECT DATABASE() as db');
        const dbName = dbInfo[0].db;
        
        const [tables] = await pool.execute(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'PlayerStatsNew'",
            [dbName]
        );
        
        if (tables.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'PlayerStatsNew table does not exist.' 
            });
        }

        // Try multiple formats for SteamId matching
        // SteamId in database is bigint(20) unsigned, so we need to handle it properly
        // MySQL bigint unsigned can lose precision if not handled correctly
        let stats = [];
        
        // Normalize SteamID - remove any leading/trailing zeros or spaces
        const normalizedSteamId = steamId.toString().trim();
        
        console.log(`[PlayerStats API] Searching for SteamID: ${normalizedSteamId} (type: ${typeof steamId})`);
        
        // Method 1: Try as string (MySQL will auto-convert for comparison)
        // This is the most reliable for bigint unsigned
        // Use CAST to ensure SteamId is returned as string
        try {
            [stats] = await pool.execute(
                `SELECT 
                    CAST(SteamId AS CHAR) as SteamId,
                    Name,
                    Kills,
                    Headshots,
                    PVPDeaths,
                    PVEDeaths,
                    Zombies,
                    MegaZombies,
                    Animals,
                    Resources,
                    Harvests,
                    Fish,
                    Structures,
                    Barricades,
                    Playtime,
                    UIDisabled,
                    LastUpdated
                FROM PlayerStatsNew
                WHERE SteamId = ?`,
                [normalizedSteamId]
            );
            if (stats.length > 0) {
                console.log(`[PlayerStats API] Found using string comparison`);
            }
        } catch (e) {
            console.warn('Error querying with string SteamId:', e.message);
        }
        
        // Method 2: Try as numeric (for bigint unsigned, use string to avoid precision loss)
        if (stats.length === 0) {
            try {
                // For bigint unsigned, we need to use string to preserve full precision
                // JavaScript Number can't safely represent all bigint values
                [stats] = await pool.execute(
                    `SELECT 
                        CAST(SteamId AS CHAR) as SteamId,
                        Name,
                        Kills,
                        Headshots,
                        PVPDeaths,
                        PVEDeaths,
                        Zombies,
                        MegaZombies,
                        Animals,
                        Resources,
                        Harvests,
                        Fish,
                        Structures,
                        Barricades,
                        Playtime,
                        UIDisabled,
                        LastUpdated
                    FROM PlayerStatsNew
                    WHERE SteamId = CAST(? AS UNSIGNED)`,
                    [normalizedSteamId]
                );
                if (stats.length > 0) {
                    console.log(`[PlayerStats API] Found using CAST AS UNSIGNED`);
                }
            } catch (e) {
                console.warn('Error querying with CAST UNSIGNED SteamId:', e.message);
            }
        }
        
        // Method 3: Try string comparison using CAST (handles any formatting differences)
        if (stats.length === 0) {
            try {
                [stats] = await pool.execute(
                    `SELECT 
                        CAST(SteamId AS CHAR) as SteamId,
                        Name,
                        Kills,
                        Headshots,
                        PVPDeaths,
                        PVEDeaths,
                        Zombies,
                        MegaZombies,
                        Animals,
                        Resources,
                        Harvests,
                        Fish,
                        Structures,
                        Barricades,
                        Playtime,
                        UIDisabled,
                        LastUpdated
                    FROM PlayerStatsNew
                    WHERE CAST(SteamId AS CHAR) = ?`,
                    [normalizedSteamId]
                );
                if (stats.length > 0) {
                    console.log(`[PlayerStats API] Found using CAST AS CHAR`);
                }
            } catch (e) {
                console.warn('Error querying with CAST CHAR SteamId:', e.message);
            }
        }
        
        // Debug: Log what we're searching for and show sample data
        if (stats.length === 0) {
            console.log(`[PlayerStats] ❌ No stats found for SteamID: ${normalizedSteamId} (original: ${steamId})`);
            
            // Try to find similar SteamIDs for debugging (last 8 digits)
            try {
                const lastDigits = normalizedSteamId.slice(-8);
                const [similar] = await pool.execute(
                    `SELECT SteamId, CAST(SteamId AS CHAR) as SteamIdStr, Name FROM PlayerStatsNew 
                     WHERE CAST(SteamId AS CHAR) LIKE ? 
                     LIMIT 10`,
                    [`%${lastDigits}%`]
                );
                if (similar.length > 0) {
                    console.log(`[PlayerStats] Found similar SteamIDs (last 8 digits: ${lastDigits}):`, 
                        similar.map(s => {
                            const steamIdStr = s.SteamIdStr || (s.SteamId ? String(s.SteamId) : 'null');
                            return { SteamId: steamIdStr, Name: s.Name || 'N/A' };
                        })
                    );
                } else {
                    console.log(`[PlayerStats] No similar SteamIDs found with last 8 digits: ${lastDigits}`);
                }
            } catch (e) {
                console.warn('[PlayerStats] Error finding similar SteamIDs:', e.message);
            }
        } else {
            const foundSteamId = stats[0].SteamId ? String(stats[0].SteamId) : 'null';
            console.log(`[PlayerStats] ✓ Found stats for SteamID: ${foundSteamId} (searched: ${normalizedSteamId}), Name: ${stats[0].Name || 'N/A'}`);
        }

        if (stats.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Player stats not found',
                steamId: normalizedSteamId,
                searched: normalizedSteamId
            });
        }

        // Ensure SteamId in response is always a string
        const result = stats[0];
        if (result.SteamId) {
            result.SteamId = String(result.SteamId);
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Get faction quest completions
app.get('/api/factions/:id/quests', async (req, res) => {
    try {
        const factionId = req.params.id;
        
        // Check if faction_quest_completions table exists
        const [dbInfo] = await pool.execute('SELECT DATABASE() as db');
        const dbName = dbInfo[0].db;
        
        const [tables] = await pool.execute(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'faction_quest_completions'",
            [dbName]
        );
        
        if (tables.length === 0) {
            return res.json({ 
                success: true, 
                data: [],
                stats: {},
                message: 'faction_quest_completions table does not exist.' 
            });
        }

        // Get all quest completions for this faction
        const [completions] = await pool.execute(
            `SELECT 
                Id,
                FactionId,
                QuestId,
                QuestName,
                QuestTier,
                CAST(CompletedBy AS CHAR) as CompletedBy,
                CompletedAt,
                PointsEarned
            FROM faction_quest_completions
            WHERE FactionId = ?
            ORDER BY CompletedAt DESC`,
            [factionId]
        );

        // Calculate stats per tier
        const stats = {
            total: completions.length,
            byTier: {},
            totalPoints: 0
        };

        completions.forEach(completion => {
            const tier = completion.QuestTier || 1;
            if (!stats.byTier[tier]) {
                stats.byTier[tier] = 0;
            }
            stats.byTier[tier]++;
            stats.totalPoints += completion.PointsEarned || 0;
        });

        res.json({
            success: true,
            data: completions,
            stats: stats
        });
    } catch (error) {
        console.error('Error fetching faction quest completions:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Get faction quest completion stats
app.get('/api/factions/:id/quests/stats', async (req, res) => {
    try {
        const factionId = req.params.id;
        
        // Check if faction_quest_completions table exists
        const [dbInfo] = await pool.execute('SELECT DATABASE() as db');
        const dbName = dbInfo[0].db;
        
        const [tables] = await pool.execute(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'faction_quest_completions'",
            [dbName]
        );
        
        if (tables.length === 0) {
            return res.json({ 
                success: true, 
                stats: {
                    total: 0,
                    byTier: {},
                    totalPoints: 0
                }
            });
        }

        // Get stats grouped by tier
        const [tierStats] = await pool.execute(
            `SELECT 
                QuestTier,
                COUNT(*) as count,
                SUM(PointsEarned) as totalPoints
            FROM faction_quest_completions
            WHERE FactionId = ?
            GROUP BY QuestTier
            ORDER BY QuestTier`,
            [factionId]
        );

        const [totalResult] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(PointsEarned) as totalPoints
            FROM faction_quest_completions
            WHERE FactionId = ?`,
            [factionId]
        );

        const stats = {
            total: totalResult[0]?.total || 0,
            totalPoints: totalResult[0]?.totalPoints || 0,
            byTier: {}
        };

        tierStats.forEach(tier => {
            stats.byTier[tier.QuestTier] = {
                count: tier.count,
                points: tier.totalPoints || 0
            };
        });

        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Error fetching faction quest stats:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Record faction quest completion
app.post('/api/factions/:id/quests', async (req, res) => {
    try {
        const factionId = req.params.id;
        const {
            QuestId,
            QuestName,
            QuestTier = 1,
            CompletedBy = null,
            PointsEarned = 0
        } = req.body;

        if (!QuestId) {
            return res.status(400).json({ success: false, error: 'QuestId is required' });
        }

        // Check if faction_quest_completions table exists
        const [dbInfo] = await pool.execute('SELECT DATABASE() as db');
        const dbName = dbInfo[0].db;
        
        const [tables] = await pool.execute(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'faction_quest_completions'",
            [dbName]
        );
        
        if (tables.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'faction_quest_completions table does not exist. Please create the table first.' 
            });
        }

        // Insert quest completion
        const [result] = await pool.execute(
            `INSERT INTO faction_quest_completions 
            (FactionId, QuestId, QuestName, QuestTier, CompletedBy, PointsEarned)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [factionId, QuestId, QuestName || QuestId, QuestTier, CompletedBy, PointsEarned]
        );

        res.json({
            success: true,
            message: 'Quest completion recorded',
            data: {
                Id: result.insertId,
                FactionId: factionId,
                QuestId: QuestId,
                QuestName: QuestName || QuestId,
                QuestTier: QuestTier,
                CompletedBy: CompletedBy,
                PointsEarned: PointsEarned
            }
        });
    } catch (error) {
        console.error('Error recording faction quest completion:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Debug endpoint - check database schema
app.get('/api/debug/schema', async (req, res) => {
    try {
        const [dbInfo] = await pool.execute('SELECT DATABASE() as db');
        const dbName = dbInfo[0].db;
        
        const [tables] = await pool.execute(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?",
            [dbName]
        );
        
        const [factionColumns] = await pool.execute(
            "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'factions'",
            [dbName]
        );
        
        const [pfColumns] = await pool.execute(
            "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'player_factions'",
            [dbName]
        );
        
        const [factionCount] = await pool.execute('SELECT COUNT(*) as count FROM factions');
        
        res.json({
            success: true,
            database: dbName,
            tables: tables.map(t => t.TABLE_NAME),
            factionColumns: factionColumns,
            playerFactionsColumns: pfColumns,
            factionCount: factionCount[0].count
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Faction Web Manager running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME || 's143_db_unturned'}`);
});

