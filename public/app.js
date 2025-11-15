// API Base URL
const API_BASE = '/api';

// Current active tab
let currentTab = 'factions';

// Player Stats state
let playerStatsCurrentPage = 0;
let playerStatsPageSize = 50;
let playerStatsSearchTimeout = null;

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, fetching data...');
    
    // Test connection first
    fetch(`${API_BASE}/health`)
        .then(res => res.json())
        .then(result => {
            console.log('Health check:', result);
            if (result.success) {
                loadFactions();
                loadLeaderboard();
                loadStats();
            } else {
                showError('Database connection failed. Please check server logs.');
            }
        })
        .catch(error => {
            console.error('Health check failed:', error);
            showError('Cannot connect to server. Please check if server is running.');
        });
});

// Tab management
function showTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('text-primary', 'border-primary');
        btn.classList.add('text-gray-500', 'border-transparent');
    });
    
    const activeButton = document.getElementById(`tab-${tab}`);
    if (activeButton) {
        activeButton.classList.remove('text-gray-500', 'border-transparent');
        activeButton.classList.add('text-primary', 'border-primary');
    }
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(`tab-content-${tab}`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
        
        // Load player stats when tab is shown
        if (tab === 'playerstats') {
            loadPlayerStats();
        }
    }
}

// Load all factions
async function loadFactions() {
    try {
        console.log('Loading factions...');
        const response = await fetch(`${API_BASE}/factions`);
        const result = await response.json();
        
        console.log('Factions response:', result);
        
        if (result.success) {
            if (result.message) {
                console.warn('Message:', result.message);
                showError(result.message);
            }
            const factions = result.data || [];
            console.log(`Received ${factions.length} factions`);
            if (factions.length === 0) {
                console.log('No factions in database. This is normal if no factions have been created yet.');
            }
            displayFactions(factions);
        } else {
            console.error('API Error:', result);
            showError('Failed to load factions: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading factions:', error);
        showError('Error loading factions: ' + error.message);
    }
}

// Display factions
function displayFactions(factions) {
    const factionList = document.getElementById('factionList');
    
    console.log('Displaying factions:', factions);
    
    if (!factions || factions.length === 0) {
        factionList.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No factions found. Click "Add Faction" to create one.</div>';
        return;
    }
    
    factionList.innerHTML = factions.map(faction => createFactionCard(faction)).join('');
}

// Create faction card HTML
function createFactionCard(faction) {
    const tierNames = {
        1: 'Tier I',
        2: 'Tier II',
        3: 'Tier III',
        4: 'Tier IV',
        5: 'Tier V'
    };
    
    const tierColors = {
        1: 'bg-blue-100 text-blue-800',
        2: 'bg-green-100 text-green-800',
        3: 'bg-yellow-100 text-yellow-800',
        4: 'bg-orange-100 text-orange-800',
        5: 'bg-red-100 text-red-800'
    };
    
    // Ensure ChatColor exists
    const chatColor = faction.ChatColor || faction.Color || 'cyan';
    const prefix = faction.Prefix || '';
    const suffix = faction.Suffix || '';
    
    return `
        <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-semibold text-gray-800">${escapeHtml(faction.Name || 'Unknown')}</h3>
                    ${faction.Tag ? `<p class="text-sm text-gray-600">[${escapeHtml(faction.Tag)}]</p>` : ''}
                </div>
                <span class="px-2 py-1 text-xs font-medium rounded ${tierColors[faction.Tier] || 'bg-gray-100 text-gray-800'}">
                    ${tierNames[faction.Tier] || `Tier ${faction.Tier || 1}`}
                </span>
            </div>
            
            <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Points:</span>
                    <span class="font-medium text-gray-800">${formatNumber(faction.TotalPoints || 0)}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Members:</span>
                    <span class="font-medium text-gray-800">${faction.MemberCount || 0}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">ID:</span>
                    <span class="font-mono text-xs text-gray-500">${escapeHtml(faction.Id || 'N/A')}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Color:</span>
                    <span class="font-mono text-xs" style="color: ${chatColor}">${escapeHtml(chatColor)}</span>
                </div>
            </div>
            
            ${prefix || suffix ? `
            <div class="mb-4 p-2 bg-gray-50 rounded text-sm">
                <div class="text-gray-600 mb-1">Chat Format:</div>
                <div class="font-mono text-xs">
                    ${prefix ? `<span class="text-primary">${escapeHtml(prefix)}</span>` : ''}
                    <span class="text-gray-700">PlayerName</span>
                    ${suffix ? `<span class="text-primary">${escapeHtml(suffix)}</span>` : ''}
                </div>
            </div>
            ` : ''}
            
            <div class="flex space-x-2">
                <button onclick="viewFactionDetails('${faction.Id}')" 
                        class="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200 transition text-sm">
                    👁️ View Details
                </button>
                <button onclick="editFaction('${faction.Id}')" 
                        class="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition text-sm">
                    ✏️ Edit
                </button>
                <button onclick="deleteFaction('${faction.Id}')" 
                        class="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 transition text-sm">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `;
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/leaderboard?limit=100`);
        const result = await response.json();
        
        if (result.success) {
            displayLeaderboard(result.data);
        } else {
            showError('Failed to load leaderboard: ' + result.error);
        }
    } catch (error) {
        showError('Error loading leaderboard: ' + error.message);
    }
}

// Display leaderboard
function displayLeaderboard(factions) {
    const tbody = document.getElementById('leaderboardBody');
    
    console.log('Displaying leaderboard:', factions);
    
    if (!factions || factions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No factions found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = factions.map((faction, index) => {
        const rank = index + 1;
        const tierNames = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };
        const tierBadges = {
            1: '<span class="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">Tier I</span>',
            2: '<span class="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">Tier II</span>',
            3: '<span class="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">Tier III</span>',
            4: '<span class="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800">Tier IV</span>',
            5: '<span class="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">Tier V</span>'
        };
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <span class="text-lg font-bold ${rank <= 3 ? 'text-yellow-500' : 'text-gray-700'}">#${rank}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(faction.Name || 'Unknown')}</div>
                    ${faction.Tag ? `<div class="text-sm text-gray-500">[${escapeHtml(faction.Tag)}]</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${tierBadges[faction.Tier] || `<span class="text-sm text-gray-500">Tier ${faction.Tier || 1}</span>`}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatNumber(faction.TotalPoints || 0)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${faction.MemberCount || 0} members
                </td>
            </tr>
        `;
    }).join('');
}

// Load statistics
async function loadStats() {
    try {
        console.log('Loading stats...');
        const response = await fetch(`${API_BASE}/stats`);
        const result = await response.json();
        
        console.log('Stats response:', result);
        
        if (result.success) {
            displayStats(result.data);
        } else {
            console.error('Stats error:', result.error);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Display statistics
function displayStats(stats) {
    const statsBar = document.getElementById('statsBar');
    
    const tierStatsHtml = stats.tierStats && stats.tierStats.length > 0
        ? stats.tierStats.map(t => `<span class="text-xs text-gray-600">Tier ${t.Tier}: ${t.count}</span>`).join('')
        : '';
    
    statsBar.innerHTML = `
        <div class="text-center">
            <div class="text-2xl font-bold text-gray-800">${stats.totalFactions || 0}</div>
            <div class="text-sm text-gray-600">Total Factions</div>
        </div>
        <div class="text-center">
            <div class="text-2xl font-bold text-gray-800">${stats.totalPlayers || 0}</div>
            <div class="text-sm text-gray-600">Total Players</div>
        </div>
        <div class="text-center">
            <div class="text-2xl font-bold text-gray-800">${formatNumber(stats.totalXP || 0)}</div>
            <div class="text-sm text-gray-600">Total XP Donated</div>
        </div>
        <div class="text-center">
            <div class="text-sm text-gray-600 mb-1">Tier Distribution</div>
            <div class="flex flex-wrap justify-center gap-2">${tierStatsHtml}</div>
        </div>
    `;
}

// Show add faction modal
function showAddFactionModal() {
    document.getElementById('modalTitle').textContent = 'Add New Faction';
    document.getElementById('factionForm').reset();
    document.getElementById('factionId').disabled = false;
    document.getElementById('factionModal').classList.remove('hidden');
    
    // Set default values
    document.getElementById('chatColor').value = 'cyan';
}

// Edit faction
async function editFaction(factionId) {
    try {
        const response = await fetch(`${API_BASE}/factions/${factionId}`);
        const result = await response.json();
        
        if (result.success) {
            populateFactionForm(result.data);
            document.getElementById('modalTitle').textContent = 'Edit Faction';
            document.getElementById('factionId').disabled = true;
            document.getElementById('factionModal').classList.remove('hidden');
        } else {
            showError('Failed to load faction: ' + result.error);
        }
    } catch (error) {
        showError('Error loading faction: ' + error.message);
    }
}

// Populate form with faction data
function populateFactionForm(faction) {
    document.getElementById('factionId').value = faction.Id;
    document.getElementById('factionName').value = faction.Name || '';
    document.getElementById('factionTag').value = faction.Tag || '';
    document.getElementById('factionPrefix').value = faction.Prefix || '';
    document.getElementById('factionSuffix').value = faction.Suffix || '';
    document.getElementById('chatColor').value = faction.ChatColor || 'cyan';
    document.getElementById('ownerId').value = faction.OwnerId || '';
}

// Save faction
async function saveFaction(event) {
    event.preventDefault();
    
    try {
        const factionId = document.getElementById('factionId').value;
        const isEdit = document.getElementById('factionId').disabled;
        
        const factionData = {
            Id: factionId,
            Name: document.getElementById('factionName').value,
            Tag: document.getElementById('factionTag').value || '',
            Prefix: document.getElementById('factionPrefix').value || '',
            Suffix: document.getElementById('factionSuffix').value || '',
            ChatColor: document.getElementById('chatColor').value || 'cyan',
            OwnerId: isEdit ? undefined : parseInt(document.getElementById('ownerId').value)
        };
        
        const url = isEdit ? `${API_BASE}/factions/${factionId}` : `${API_BASE}/factions`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(factionData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeFactionModal();
            loadFactions();
            loadLeaderboard();
            loadStats();
            showSuccess('Faction saved successfully!');
        } else {
            showError('Failed to save faction: ' + result.error);
        }
    } catch (error) {
        showError('Error saving faction: ' + error.message);
    }
}

// Delete faction
async function deleteFaction(factionId) {
    if (!confirm(`Are you sure you want to delete faction "${factionId}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/factions/${factionId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadFactions();
            loadLeaderboard();
            loadStats();
            showSuccess('Faction deleted successfully!');
        } else {
            showError('Failed to delete faction: ' + result.error);
        }
    } catch (error) {
        showError('Error deleting faction: ' + error.message);
    }
}

// Close faction modal
function closeFactionModal() {
    document.getElementById('factionModal').classList.add('hidden');
    document.getElementById('factionForm').reset();
}

// View faction details
async function viewFactionDetails(factionId) {
    try {
        console.log('Loading faction details for:', factionId);
        const response = await fetch(`${API_BASE}/factions/${factionId}`);
        const result = await response.json();
        
        if (result.success) {
            displayFactionDetails(result.data);
            document.getElementById('factionDetailsModal').classList.remove('hidden');
        } else {
            showError('Failed to load faction details: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading faction details:', error);
        showError('Error loading faction details: ' + error.message);
    }
}

// Display faction details
function displayFactionDetails(faction) {
    const modalTitle = document.getElementById('detailsModalTitle');
    const content = document.getElementById('factionDetailsContent');
    
    modalTitle.textContent = faction.Name || 'Faction Details';
    
    const tierNames = {
        1: 'Tier I',
        2: 'Tier II',
        3: 'Tier III',
        4: 'Tier IV',
        5: 'Tier V'
    };
    
    const tierColors = {
        1: 'bg-blue-100 text-blue-800',
        2: 'bg-green-100 text-green-800',
        3: 'bg-yellow-100 text-yellow-800',
        4: 'bg-orange-100 text-orange-800',
        5: 'bg-red-100 text-red-800'
    };
    
    const chatColor = faction.ChatColor || faction.Color || 'cyan';
    const prefix = faction.Prefix || '';
    const suffix = faction.Suffix || '';
    const members = faction.Members || [];
    
    // Sort members: leader first, then by XP
    const sortedMembers = [...members].sort((a, b) => {
        if ((a.IsLeader || a.PlayerId == faction.OwnerId) && !(b.IsLeader || b.PlayerId == faction.OwnerId)) return -1;
        if (!(a.IsLeader || a.PlayerId == faction.OwnerId) && (b.IsLeader || b.PlayerId == faction.OwnerId)) return 1;
        return (parseInt(b.XPDonated) || 0) - (parseInt(a.XPDonated) || 0);
    });
    
    const membersHtml = sortedMembers.map((member, index) => {
        const isLeader = member.IsLeader || member.PlayerId == faction.OwnerId;
        const xpDonated = parseInt(member.XPDonated) || 0;
        const totalXP = parseInt(faction.TotalXPDonated) || 1;
        const contribution = totalXP > 0 ? ((xpDonated / totalXP) * 100).toFixed(2) : '0.00';
        
        // IMPORTANT: PlayerId should already be a string from backend (normalized)
        // But we need to ensure it's a string to avoid precision loss
        // Use String() instead of .toString() to handle bigint/number safely
        let memberId;
        if (typeof member.PlayerId === 'string') {
            memberId = member.PlayerId.trim();
        } else if (typeof member.PlayerId === 'bigint') {
            memberId = member.PlayerId.toString();
        } else if (typeof member.PlayerId === 'number') {
            // For large numbers, use String() to avoid precision issues
            // If it's already lost precision, we can't recover it
            memberId = String(member.PlayerId);
        } else {
            memberId = String(member.PlayerId || '').trim();
        }
        
        console.log(`[DisplayFactionDetails] Member ${index + 1} PlayerId: ${memberId} (type: ${typeof member.PlayerId}, original: ${member.PlayerId})`);
        
        const rowId = `member-row-${memberId}`;
        const statsRowId = `member-stats-${memberId}`;
        
        return `
            <tr class="hover:bg-gray-50 ${isLeader ? 'bg-yellow-50' : ''} cursor-pointer" onclick="toggleMemberStats('${memberId}')">
                <td class="px-4 py-3 text-sm text-center">
                    <span class="font-medium text-gray-900">${index + 1}</span>
                </td>
                <td class="px-4 py-3 text-sm">
                    <div class="flex items-center">
                        ${isLeader ? '<span class="text-yellow-600 mr-2" title="Leader">👑</span>' : ''}
                        <span class="font-mono text-gray-700">${escapeHtml(memberId)}</span>
                        ${isLeader ? '<span class="ml-2 px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">Leader</span>' : ''}
                        <span id="expand-icon-${memberId}" class="ml-2 text-gray-400">▼</span>
                    </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 font-medium">
                    ${formatNumber(xpDonated)} XP
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                    ${contribution}%
                </td>
            </tr>
            <tr id="${statsRowId}" class="hidden bg-gray-50">
                <td colspan="4" class="px-4 py-4">
                    <div class="text-sm text-gray-600 mb-2">Loading player stats...</div>
                </td>
            </tr>
        `;
    }).join('');
    
    content.innerHTML = `
        <!-- Faction Info -->
        <div class="mb-6">
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div class="text-sm text-gray-600 mb-1">Faction ID</div>
                        <div class="font-mono text-lg font-semibold text-gray-800">${escapeHtml(faction.Id)}</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 mb-1">Faction Name</div>
                        <div class="text-lg font-semibold text-gray-800">${escapeHtml(faction.Name || 'Unknown')}</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 mb-1">Tag</div>
                        <div class="text-lg text-gray-800">${faction.Tag ? `[${escapeHtml(faction.Tag)}]` : 'N/A'}</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 mb-1">Tier</div>
                        <span class="px-3 py-1 text-sm font-medium rounded ${tierColors[faction.Tier] || 'bg-gray-100 text-gray-800'}">
                            ${tierNames[faction.Tier] || `Tier ${faction.Tier || 1}`}
                        </span>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 mb-1">Total Points</div>
                        <div class="text-lg font-semibold text-gray-800">${formatNumber(faction.TotalPoints || 0)}</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 mb-1">Total XP Donated</div>
                        <div class="text-lg font-semibold text-green-600">${formatNumber(faction.TotalXPDonated || 0)} XP</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 mb-1">Chat Color</div>
                        <div class="flex items-center">
                            <span class="font-mono text-sm mr-2" style="color: ${chatColor}">${escapeHtml(chatColor)}</span>
                            <div class="w-6 h-6 rounded border border-gray-300" style="background-color: ${chatColor}"></div>
                        </div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 mb-1">Owner ID</div>
                        <div class="font-mono text-sm text-gray-800">${faction.OwnerId || 'N/A'}</div>
                    </div>
                </div>
            </div>
            
            ${prefix || suffix ? `
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <div class="text-sm text-gray-600 mb-2">Chat Format</div>
                <div class="font-mono text-sm bg-white p-2 rounded border">
                    ${prefix ? `<span style="color: ${chatColor}">${escapeHtml(prefix)}</span>` : ''}
                    <span class="text-gray-700">PlayerName</span>
                    ${suffix ? `<span style="color: ${chatColor}">${escapeHtml(suffix)}</span>` : ''}
                </div>
            </div>
            ` : ''}
        </div>
        
        <!-- Members Section -->
        <div class="mb-4">
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-xl font-semibold text-gray-800">Members (${faction.MemberCount || 0})</h4>
            </div>
            
            ${members.length === 0 ? `
                <div class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    No members found.
                </div>
            ` : `
                <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player ID</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP Donated</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contribution</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${membersHtml}
                        </tbody>
                    </table>
                    <div class="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
                        💡 Click on a player row to view their detailed statistics
                    </div>
                </div>
            `}
        </div>
        
        <!-- Quest Completion Stats -->
        <div id="questStatsSection" class="mb-4">
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-xl font-semibold text-gray-800">Quest Completion</h4>
                <button onclick="loadFactionQuestStats('${faction.Id}')" 
                        class="text-sm text-blue-600 hover:text-blue-800">
                    🔄 Refresh
                </button>
            </div>
            <div id="questStatsContent" class="bg-blue-50 rounded-lg p-4">
                <div class="text-sm text-gray-600">Loading quest statistics...</div>
            </div>
        </div>
        
        <!-- Stats Summary -->
        <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm font-medium text-gray-700 mb-2">Statistics Summary</div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <div class="text-gray-600">Total Members</div>
                    <div class="text-lg font-semibold text-gray-800">${faction.MemberCount || 0}</div>
                </div>
                <div>
                    <div class="text-gray-600">Total XP</div>
                    <div class="text-lg font-semibold text-green-600">${formatNumber(faction.TotalXPDonated || 0)}</div>
                </div>
                <div>
                    <div class="text-gray-600">Avg XP/Member</div>
                    <div class="text-lg font-semibold text-gray-800">
                        ${faction.MemberCount > 0 ? formatNumber(Math.floor((faction.TotalXPDonated || 0) / faction.MemberCount)) : 0}
                    </div>
                </div>
                <div>
                    <div class="text-gray-600">Faction Points</div>
                    <div class="text-lg font-semibold text-gray-800">${formatNumber(faction.TotalPoints || 0)}</div>
                </div>
            </div>
        </div>
    `;
    
    // Load quest stats after displaying faction details
    loadFactionQuestStats(faction.Id);
}

// Close faction details modal
function closeFactionDetailsModal() {
    document.getElementById('factionDetailsModal').classList.add('hidden');
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

function showSuccess(message) {
    showToast(message, 'green');
}

function showError(message) {
    showToast(message, 'red');
}

function showToast(message, color = 'green') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) {
        console.log(`Toast [${color}]:`, message);
        return;
    }
    
    toastMessage.textContent = message;
    
    // Remove existing color classes
    toast.className = toast.className.replace(/border-\w+-\d+/g, '');
    
    // Add new color class
    const colorClass = color === 'green' ? 'border-green-500' : color === 'red' ? 'border-red-500' : 'border-blue-500';
    toast.className = `fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border-l-4 ${colorClass} z-50 max-w-sm`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 5000);
}

// Load player stats
async function loadPlayerStats() {
    try {
        const search = document.getElementById('playerStatsSearch')?.value || '';
        const sortBy = document.getElementById('playerStatsSortBy')?.value || 'Kills';
        const sortOrder = document.getElementById('playerStatsSortOrder')?.value || 'desc';
        const limit = playerStatsPageSize;
        const offset = playerStatsCurrentPage * playerStatsPageSize;

        const params = new URLSearchParams({
            limit: limit,
            offset: offset,
            sortBy: sortBy,
            sortOrder: sortOrder
        });

        if (search) {
            params.append('search', search);
        }

        const response = await fetch(`${API_BASE}/playerstats?${params.toString()}`);
        const result = await response.json();
        
        if (result.success) {
            displayPlayerStats(result.data, result.total, result.limit, result.offset);
        } else {
            if (result.message && result.message.includes('does not exist')) {
                displayPlayerStats([], 0, 0, 0, result.message);
            } else {
                showError('Failed to load player stats: ' + (result.error || 'Unknown error'));
            }
        }
    } catch (error) {
        console.error('Error loading player stats:', error);
        showError('Error loading player stats: ' + error.message);
    }
}

// Display player stats
function displayPlayerStats(stats, total, limit, offset, message = null) {
    const tbody = document.getElementById('playerStatsBody');
    
    if (message) {
        tbody.innerHTML = `<tr><td colspan="9" class="px-6 py-4 text-center text-gray-500">${escapeHtml(message)}</td></tr>`;
        document.getElementById('playerStatsPagination').innerHTML = '';
        return;
    }
    
    if (!stats || stats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-gray-500">No player stats found.</td></tr>';
        document.getElementById('playerStatsPagination').innerHTML = '';
        return;
    }
    
    tbody.innerHTML = stats.map((stat, index) => {
        const globalRank = offset + index + 1;
        const playtimeHours = Math.floor((stat.Playtime || 0) / 3600);
        const playtimeMinutes = Math.floor(((stat.Playtime || 0) % 3600) / 60);
        const playtimeFormatted = playtimeHours > 0 
            ? `${playtimeHours}h ${playtimeMinutes}m` 
            : `${playtimeMinutes}m`;
        
        // IMPORTANT: Ensure SteamId is always a string to preserve precision
        // SteamId should already be string from backend (with bigNumberStrings: true)
        // But we need to ensure it's string to avoid precision loss
        const steamIdStr = stat.SteamId ? String(stat.SteamId) : '0';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(stat.Name || 'Unknown')}</div>
                    <div class="text-xs text-gray-500 font-mono">${steamIdStr}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatNumber(stat.Kills || 0)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatNumber(stat.Headshots || 0)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatNumber(stat.Zombies || 0)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatNumber(stat.MegaZombies || 0)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatNumber(stat.Animals || 0)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatNumber(stat.Resources || 0)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${playtimeFormatted}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button onclick="viewPlayerStatsDetails('${steamIdStr}')" 
                            class="text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                        View Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update pagination
    updatePlayerStatsPagination(total, limit, offset);
}

// Update pagination
function updatePlayerStatsPagination(total, limit, offset) {
    const paginationDiv = document.getElementById('playerStatsPagination');
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;
    
    if (totalPages <= 1) {
        paginationDiv.innerHTML = `<div class="text-sm text-gray-600">Showing ${total} results</div>`;
        return;
    }
    
    let paginationHTML = `<div class="text-sm text-gray-600">Showing ${offset + 1}-${Math.min(offset + limit, total)} of ${formatNumber(total)} results</div>`;
    paginationHTML += '<div class="flex space-x-2">';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button onclick="goToPlayerStatsPage(${currentPage - 2})" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Previous</button>`;
    } else {
        paginationHTML += `<button disabled class="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-400 text-sm cursor-not-allowed">Previous</button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button onclick="goToPlayerStatsPage(0)" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="px-2 py-2 text-gray-500">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="px-3 py-2 border border-primary bg-primary text-white rounded-lg text-sm">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="goToPlayerStatsPage(${i - 1})" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="px-2 py-2 text-gray-500">...</span>`;
        }
        paginationHTML += `<button onclick="goToPlayerStatsPage(${totalPages - 1})" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">${totalPages}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="goToPlayerStatsPage(${currentPage})" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Next</button>`;
    } else {
        paginationHTML += `<button disabled class="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-400 text-sm cursor-not-allowed">Next</button>`;
    }
    
    paginationHTML += '</div>';
    paginationDiv.innerHTML = paginationHTML;
}

// Go to specific page
function goToPlayerStatsPage(page) {
    playerStatsCurrentPage = page;
    loadPlayerStats();
}

// Handle search with debounce
function handlePlayerStatsSearch(event) {
    if (event.key === 'Enter' || event.type === 'keyup') {
        clearTimeout(playerStatsSearchTimeout);
        playerStatsSearchTimeout = setTimeout(() => {
            playerStatsCurrentPage = 0;
            loadPlayerStats();
        }, 500);
    }
}

// Sort player stats
function sortPlayerStats(column) {
    const sortBySelect = document.getElementById('playerStatsSortBy');
    if (sortBySelect) {
        sortBySelect.value = column;
        playerStatsCurrentPage = 0;
        loadPlayerStats();
    }
}

// View player stats details
async function viewPlayerStatsDetails(steamId) {
    try {
        const response = await fetch(`${API_BASE}/playerstats/${steamId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            displayPlayerStatsDetails(result.data);
        } else {
            // Show friendly message if stats not found
            if (result.error && result.error.includes('not found')) {
                showError(`Player statistics not found for SteamID: ${steamId}. This player may not have any statistics recorded yet.`);
            } else {
                showError('Failed to load player stats: ' + (result.error || 'Unknown error'));
            }
        }
    } catch (error) {
        console.error('Error loading player stats details:', error);
        showError('Error loading player stats details: ' + error.message);
    }
}

// Toggle member stats in faction details
async function toggleMemberStats(steamId) {
    const statsRowId = `member-stats-${steamId}`;
    const expandIconId = `expand-icon-${steamId}`;
    const statsRow = document.getElementById(statsRowId);
    const expandIcon = document.getElementById(expandIconId);
    
    if (!statsRow) return;
    
    // Toggle visibility
    if (statsRow.classList.contains('hidden')) {
        // Show and load stats
        statsRow.classList.remove('hidden');
        if (expandIcon) expandIcon.textContent = '▲';
        
        // Check if already loaded
        if (statsRow.querySelector('.player-stats-loaded')) {
            return; // Already loaded
        }
        
        // Normalize SteamID - ensure it's a clean string
        // IMPORTANT: Don't remove leading zeros as SteamID is a fixed-length number
        // Just trim whitespace and ensure it's a string
        const normalizedSteamId = steamId.toString().trim();
        console.log(`[ToggleMemberStats] Loading stats for SteamID: ${normalizedSteamId} (original: ${steamId}, type: ${typeof steamId})`);
        
        // Load player stats
        try {
            const response = await fetch(`${API_BASE}/playerstats/${normalizedSteamId}`);
            const result = await response.json();
            
            console.log(`[ToggleMemberStats] Response for ${normalizedSteamId}:`, result);
            
            if (result.success && result.data) {
                const stats = result.data;
                const statsHtml = formatMemberStatsHTML(stats);
                statsRow.innerHTML = `<td colspan="4" class="px-4 py-4">${statsHtml}</td>`;
                statsRow.querySelector('td').classList.add('player-stats-loaded');
            } else {
                // Player stats not found - show message with SteamID for debugging
                const notFoundHtml = `
                    <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <div class="text-sm text-yellow-800">
                            <div class="font-semibold mb-1">⚠️ Player Statistics Not Available</div>
                            <div class="text-xs text-yellow-700 mb-2">This player has no statistics recorded yet in the database.</div>
                            <div class="text-xs text-gray-600 font-mono">SteamID searched: ${normalizedSteamId}</div>
                        </div>
                    </div>
                `;
                statsRow.innerHTML = `<td colspan="4" class="px-4 py-4">${notFoundHtml}</td>`;
                statsRow.querySelector('td').classList.add('player-stats-loaded');
            }
        } catch (error) {
            console.error('Error loading member stats:', error);
            const errorHtml = `
                <div class="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div class="text-sm text-red-800">
                        <div class="font-semibold mb-1">❌ Error Loading Stats</div>
                        <div class="text-xs text-red-700">${escapeHtml(error.message)}</div>
                        <div class="text-xs text-gray-600 font-mono mt-2">SteamID: ${normalizedSteamId}</div>
                    </div>
                </div>
            `;
            statsRow.innerHTML = `<td colspan="4" class="px-4 py-4">${errorHtml}</td>`;
            statsRow.querySelector('td').classList.add('player-stats-loaded');
        }
    } else {
        // Hide stats
        statsRow.classList.add('hidden');
        if (expandIcon) expandIcon.textContent = '▼';
    }
}

// Format member stats HTML for faction details
function formatMemberStatsHTML(stats) {
    const playtimeHours = Math.floor((stats.Playtime || 0) / 3600);
    const playtimeMinutes = Math.floor(((stats.Playtime || 0) % 3600) / 60);
    const playtimeFormatted = playtimeHours > 0 
        ? `${playtimeHours}h ${playtimeMinutes}m` 
        : `${playtimeMinutes}m`;
    
    return `
        <div class="bg-white rounded-lg p-4 border border-gray-200">
            <div class="text-sm font-semibold text-gray-800 mb-3">Player Statistics</div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <div class="text-gray-600 text-xs mb-1">Kills</div>
                    <div class="font-semibold text-gray-800">${formatNumber(stats.Kills || 0)}</div>
                </div>
                <div>
                    <div class="text-gray-600 text-xs mb-1">Headshots</div>
                    <div class="font-semibold text-gray-800">${formatNumber(stats.Headshots || 0)}</div>
                </div>
                <div>
                    <div class="text-gray-600 text-xs mb-1">Zombies</div>
                    <div class="font-semibold text-gray-800">${formatNumber(stats.Zombies || 0)}</div>
                </div>
                <div>
                    <div class="text-gray-600 text-xs mb-1">Mega Zombies</div>
                    <div class="font-semibold text-orange-600">${formatNumber(stats.MegaZombies || 0)}</div>
                </div>
                <div>
                    <div class="text-gray-600 text-xs mb-1">Animals</div>
                    <div class="font-semibold text-gray-800">${formatNumber(stats.Animals || 0)}</div>
                </div>
                <div>
                    <div class="text-gray-600 text-xs mb-1">Resources</div>
                    <div class="font-semibold text-gray-800">${formatNumber(stats.Resources || 0)}</div>
                </div>
                <div>
                    <div class="text-gray-600 text-xs mb-1">Harvests</div>
                    <div class="font-semibold text-gray-800">${formatNumber(stats.Harvests || 0)}</div>
                </div>
                <div>
                    <div class="text-gray-600 text-xs mb-1">Fish</div>
                    <div class="font-semibold text-gray-800">${formatNumber(stats.Fish || 0)}</div>
                </div>
                <div>
                    <div class="text-gray-600 text-xs mb-1">Structures</div>
                    <div class="font-semibold text-gray-800">${formatNumber(stats.Structures || 0)}</div>
                </div>
                <div>
                    <div class="text-gray-600 text-xs mb-1">Barricades</div>
                    <div class="font-semibold text-gray-800">${formatNumber(stats.Barricades || 0)}</div>
                </div>
                <div>
                    <div class="text-gray-600 text-xs mb-1">PVP Deaths</div>
                    <div class="font-semibold text-red-600">${formatNumber(stats.PVPDeaths || 0)}</div>
                </div>
                <div>
                    <div class="text-gray-600 text-xs mb-1">PVE Deaths</div>
                    <div class="font-semibold text-red-600">${formatNumber(stats.PVEDeaths || 0)}</div>
                </div>
                <div class="col-span-2">
                    <div class="text-gray-600 text-xs mb-1">Playtime</div>
                    <div class="font-semibold text-gray-800">${playtimeFormatted}</div>
                </div>
            </div>
        </div>
    `;
}

// Display player stats details
function displayPlayerStatsDetails(stats) {
    // Create modal HTML
    const playtimeHours = Math.floor((stats.Playtime || 0) / 3600);
    const playtimeMinutes = Math.floor(((stats.Playtime || 0) % 3600) / 60);
    const playtimeFormatted = playtimeHours > 0 
        ? `${playtimeHours} hours ${playtimeMinutes} minutes` 
        : `${playtimeMinutes} minutes`;
    
    const lastUpdated = stats.LastUpdated ? new Date(stats.LastUpdated).toLocaleString() : 'N/A';
    
    const modalHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closePlayerStatsDetailsModal()">
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-800">Player Statistics - ${escapeHtml(stats.Name || 'Unknown')}</h3>
                        <button onclick="closePlayerStatsDetailsModal()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Combat Stats -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="text-lg font-semibold text-gray-800 mb-4">Combat Statistics</h4>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Kills:</span>
                                    <span class="font-semibold text-gray-800">${formatNumber(stats.Kills || 0)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Headshots:</span>
                                    <span class="font-semibold text-gray-800">${formatNumber(stats.Headshots || 0)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">PVP Deaths:</span>
                                    <span class="font-semibold text-red-600">${formatNumber(stats.PVPDeaths || 0)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">PVE Deaths:</span>
                                    <span class="font-semibold text-red-600">${formatNumber(stats.PVEDeaths || 0)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- PVE Stats -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="text-lg font-semibold text-gray-800 mb-4">PVE Statistics</h4>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Zombies Killed:</span>
                                    <span class="font-semibold text-gray-800">${formatNumber(stats.Zombies || 0)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Mega Zombies:</span>
                                    <span class="font-semibold text-orange-600">${formatNumber(stats.MegaZombies || 0)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Animals Killed:</span>
                                    <span class="font-semibold text-gray-800">${formatNumber(stats.Animals || 0)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Gathering Stats -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="text-lg font-semibold text-gray-800 mb-4">Gathering Statistics</h4>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Resources:</span>
                                    <span class="font-semibold text-gray-800">${formatNumber(stats.Resources || 0)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Harvests:</span>
                                    <span class="font-semibold text-gray-800">${formatNumber(stats.Harvests || 0)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Fish Caught:</span>
                                    <span class="font-semibold text-gray-800">${formatNumber(stats.Fish || 0)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Building Stats -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="text-lg font-semibold text-gray-800 mb-4">Building Statistics</h4>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Structures:</span>
                                    <span class="font-semibold text-gray-800">${formatNumber(stats.Structures || 0)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Barricades:</span>
                                    <span class="font-semibold text-gray-800">${formatNumber(stats.Barricades || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Additional Info -->
                    <div class="mt-6 bg-blue-50 rounded-lg p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div class="text-sm text-gray-600 mb-1">Steam ID</div>
                                <div class="font-mono text-sm text-gray-800">${stats.SteamId}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-600 mb-1">Playtime</div>
                                <div class="font-semibold text-gray-800">${playtimeFormatted}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-600 mb-1">Last Updated</div>
                                <div class="text-sm text-gray-800">${lastUpdated}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-600 mb-1">UI Disabled</div>
                                <div class="text-sm text-gray-800">${stats.UIDisabled ? 'Yes' : 'No'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('playerStatsDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    const modalDiv = document.createElement('div');
    modalDiv.id = 'playerStatsDetailsModal';
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);
}

// Close player stats details modal
function closePlayerStatsDetailsModal() {
    const modal = document.getElementById('playerStatsDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// Load faction quest completion stats
async function loadFactionQuestStats(factionId) {
    try {
        const response = await fetch(`${API_BASE}/factions/${factionId}/quests/stats`);
        const result = await response.json();
        
        if (result.success) {
            displayFactionQuestStats(result.stats);
        } else {
            const questStatsContent = document.getElementById('questStatsContent');
            if (questStatsContent) {
                if (result.message && result.message.includes('does not exist')) {
                    questStatsContent.innerHTML = `
                        <div class="text-sm text-yellow-600">
                            ⚠️ Quest tracking table not found. Please create the faction_quest_completions table.
                        </div>
                    `;
                } else {
                    questStatsContent.innerHTML = `
                        <div class="text-sm text-red-600">
                            ❌ Error loading quest stats: ${result.error || 'Unknown error'}
                        </div>
                    `;
                }
            }
        }
    } catch (error) {
        console.error('Error loading faction quest stats:', error);
        const questStatsContent = document.getElementById('questStatsContent');
        if (questStatsContent) {
            questStatsContent.innerHTML = `
                <div class="text-sm text-red-600">
                    ❌ Error loading quest stats: ${error.message}
                </div>
            `;
        }
    }
}

// Display faction quest completion stats
function displayFactionQuestStats(stats) {
    const questStatsContent = document.getElementById('questStatsContent');
    if (!questStatsContent) return;
    
    if (!stats || stats.total === 0) {
        questStatsContent.innerHTML = `
            <div class="text-sm text-gray-600">
                No quest completions recorded yet.
            </div>
        `;
        return;
    }
    
    const tierNames = {
        1: 'Tier I',
        2: 'Tier II',
        3: 'Tier III',
        4: 'Tier IV',
        5: 'Tier V'
    };
    
    const tierColors = {
        1: 'bg-blue-100 text-blue-800',
        2: 'bg-green-100 text-green-800',
        3: 'bg-yellow-100 text-yellow-800',
        4: 'bg-orange-100 text-orange-800',
        5: 'bg-red-100 text-red-800'
    };
    
    let tierStatsHtml = '';
    for (let tier = 1; tier <= 5; tier++) {
        const tierData = stats.byTier[tier] || { count: 0, points: 0 };
        tierStatsHtml += `
            <div class="text-center">
                <div class="text-xs text-gray-600 mb-1">${tierNames[tier] || `Tier ${tier}`}</div>
                <div class="text-lg font-semibold ${tierColors[tier] || 'text-gray-800'}">
                    ${formatNumber(tierData.count || 0)}
                </div>
                ${tierData.points > 0 ? `<div class="text-xs text-gray-500">${formatNumber(tierData.points)} pts</div>` : ''}
            </div>
        `;
    }
    
    questStatsContent.innerHTML = `
        <div class="mb-4">
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div class="text-center">
                    <div class="text-xs text-gray-600 mb-1">Total Quests</div>
                    <div class="text-2xl font-bold text-gray-800">${formatNumber(stats.total || 0)}</div>
                </div>
                <div class="text-center">
                    <div class="text-xs text-gray-600 mb-1">Total Points</div>
                    <div class="text-2xl font-bold text-green-600">${formatNumber(stats.totalPoints || 0)}</div>
                </div>
                <div class="text-center">
                    <div class="text-xs text-gray-600 mb-1">Avg Points/Quest</div>
                    <div class="text-2xl font-bold text-gray-800">
                        ${stats.total > 0 ? formatNumber(Math.floor((stats.totalPoints || 0) / stats.total)) : 0}
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-200 pt-4">
                <div class="text-xs text-gray-600 mb-2 text-center">Quests by Tier</div>
                <div class="grid grid-cols-5 gap-2">
                    ${tierStatsHtml}
                </div>
            </div>
        </div>
    `;
}

