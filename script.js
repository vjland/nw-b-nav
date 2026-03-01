// Constants & Types
const Winner = {
    PLAYER: 'Player',
    BANKER: 'Banker',
    TIE: 'Tie'
};

const Result = {
    WIN: 'Win',
    LOSS: 'Loss',
    PUSH: 'Push',
    PENDING: 'Pending'
};

// Application State
let state = {
    hands: [],
    nextPrediction: null,
    isKeypadOpen: false,
    isHistoryExpanded: false,
    selectedWinner: null,
    chart: null
};

// DOM Elements
const elements = {
    nextBetIndicator: document.getElementById('next-bet-indicator'),
    historyContainer: document.getElementById('history-container'),
    historyList: document.getElementById('history-list'),
    historyHeader: document.getElementById('history-header'),
    logCount: document.getElementById('log-count'),
    keypadBackdrop: document.getElementById('keypad-backdrop'),
    keypadPanel: document.getElementById('keypad-panel'),
    btnMenuTrigger: document.getElementById('btn-menu-trigger'),
    btnCloseKeypad: document.getElementById('btn-close-keypad'),
    btnPlayer: document.getElementById('btn-player'),
    btnBanker: document.getElementById('btn-banker'),
    btnYes: document.getElementById('btn-yes'),
    btnNo: document.getElementById('btn-no'),
    btnUndo: document.getElementById('btn-undo'),
    btnResetTrigger: document.getElementById('btn-reset-trigger'),
    resetModal: document.getElementById('reset-modal'),
    btnResetConfirm: document.getElementById('btn-reset-confirm'),
    btnResetCancel: document.getElementById('btn-reset-cancel')
};

// --- Initialization ---
function init() {
    initChart();
    attachEventListeners();
    render();
}

function initChart() {
    const ctx = document.getElementById('strategy-chart').getContext('2d');
    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 76 }, (_, i) => i),
            datasets: [
                {
                    label: 'Moving Average (5)',
                    data: [{ x: 0, y: 0 }],
                    borderColor: '#FFD700',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0,
                    fill: false
                },
                {
                    label: 'Performance',
                    data: [{ x: 0, y: 0 }],
                    borderColor: '#5DD3B6',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointBackgroundColor: '#5DD3B6',
                    tension: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    type: 'linear',
                    display: true,
                    min: 0,
                    max: 75,
                    border: { display: false },
                    ticks: { display: false },
                    grid: {
                        display: true,
                        color: '#111111',
                        drawTicks: false
                    }
                },
                y: {
                    display: true,
                    min: -20,
                    max: 20,
                    border: {
                        display: false
                    },
                    ticks: {
                        display: false,
                        stepSize: 2
                    },
                    grid: {
                        display: true,
                        drawTicks: false,
                        color: (context) => {
                            if (context.tick && context.tick.value === 0) return '#3f3f46';
                            return '#141417'; 
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            layout: {
                padding: 0
            }
        }
    });
}

// --- Logic ---
function calculatePrediction(lastWinner, isFourCards) {
    if (isFourCards) return Winner.BANKER;
    return Winner.PLAYER;
}

function handleHandSubmit(winner, isFourCards) {
    let unitsChanged = 0;
    let result = Result.PENDING;

    if (state.nextPrediction) {
        if (winner === state.nextPrediction) {
            result = Result.WIN;
            unitsChanged = 1;
        } else {
            result = Result.LOSS;
            unitsChanged = -1;
        }
    } else {
        result = Result.PUSH;
    }

    const lastTotal = state.hands.length > 0 ? state.hands[state.hands.length - 1].runningTotal : 0;
    const newTotal = lastTotal + unitsChanged;
    const strategyPrediction = calculatePrediction(winner, isFourCards);

    const newHand = {
        id: state.hands.length + 1,
        winner,
        isFourCards,
        prediction: state.nextPrediction,
        result,
        runningTotal: newTotal
    };

    state.hands.push(newHand);
    state.nextPrediction = strategyPrediction;
    state.isKeypadOpen = false;
    state.selectedWinner = null;
    
    render();
}

function handleUndo() {
    if (state.hands.length === 0) return;
    state.hands.pop();
    
    if (state.hands.length === 0) {
        state.nextPrediction = null;
    } else {
        const lastHand = state.hands[state.hands.length - 1];
        state.nextPrediction = calculatePrediction(lastHand.winner, lastHand.isFourCards);
    }
    
    render();
}

function handleReset() {
    state.hands = [];
    state.nextPrediction = null;
    state.selectedWinner = null;
    closeResetModal();
    render();
}

// --- UI Actions ---
function openKeypad() {
    state.isKeypadOpen = true;
    state.selectedWinner = null;
    render();
}

function closeKeypad() {
    state.isKeypadOpen = false;
    render();
}

function selectWinner(winner) {
    state.selectedWinner = winner;
    render();
}

function toggleHistory() {
    state.isHistoryExpanded = !state.isHistoryExpanded;
    render();
}

function openResetModal() {
    elements.resetModal.classList.remove('opacity-0', 'pointer-events-none');
}

function closeResetModal() {
    elements.resetModal.classList.add('opacity-0', 'pointer-events-none');
}

// --- Rendering ---
function render() {
    if (state.isKeypadOpen) {
        elements.keypadPanel.classList.remove('translate-x-full');
        elements.keypadPanel.classList.add('translate-x-0');
        elements.keypadBackdrop.classList.remove('opacity-0', 'pointer-events-none');
        elements.keypadBackdrop.classList.add('opacity-100');
    } else {
        elements.keypadPanel.classList.add('translate-x-full');
        elements.keypadPanel.classList.remove('translate-x-0');
        elements.keypadBackdrop.classList.add('opacity-0', 'pointer-events-none');
        elements.keypadBackdrop.classList.remove('opacity-100');
    }

    elements.btnPlayer.className = getButtonClass(state.selectedWinner === Winner.PLAYER, 'blue');
    elements.btnBanker.className = getButtonClass(state.selectedWinner === Winner.BANKER, 'red');

    const isWinnerSelected = !!state.selectedWinner;
    elements.btnYes.disabled = !isWinnerSelected;
    elements.btnNo.disabled = !isWinnerSelected;
    elements.btnYes.className = `h-16 flex items-center justify-center transition-all rounded-none uppercase text-xs font-black tracking-widest ${isWinnerSelected ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'}`;
    elements.btnNo.className = `h-16 flex items-center justify-center transition-all rounded-none uppercase text-xs font-black tracking-widest ${isWinnerSelected ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'}`;

    elements.btnUndo.disabled = state.hands.length === 0;
    elements.btnUndo.className = `w-full h-12 flex items-center justify-center space-x-2 text-[10px] font-bold transition-colors rounded-none uppercase tracking-widest mt-16 ${state.hands.length > 0 ? 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700' : 'text-zinc-700 cursor-not-allowed border border-zinc-800'}`;

    updatePredictionIndicator();

    elements.historyContainer.className = `flex-none bg-zinc-900 border-t border-zinc-800 flex flex-col transition-all duration-300 ease-in-out z-20 rounded-none ${state.isHistoryExpanded ? 'h-[60vh]' : 'h-20'}`;
    elements.logCount.textContent = `[${state.hands.length}]`;
    renderHistoryList();

    updateChart();
}

function getButtonClass(isSelected, color) {
    const base = "h-16 flex items-center justify-center border-2 transition-all rounded-none uppercase text-sm font-black tracking-widest ";
    if (isSelected) {
        return base + (color === 'blue' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-red-600 border-red-400 text-white');
    }
    return base + "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800";
}

function updatePredictionIndicator() {
    const indicator = elements.nextBetIndicator;
    indicator.innerHTML = '';
    const span = document.createElement('span');
    span.className = "text-2xl font-black";

    if (state.nextPrediction === Winner.PLAYER) {
        indicator.className = "flex items-center justify-center w-12 h-12 border-2 transition-all duration-300 rounded-none bg-blue-500/10 border-blue-500 text-blue-500";
        span.textContent = 'P';
    } else if (state.nextPrediction === Winner.BANKER) {
        indicator.className = "flex items-center justify-center w-12 h-12 border-2 transition-all duration-300 rounded-none bg-red-500/10 border-red-500 text-red-500";
        span.textContent = 'B';
    } else {
        indicator.className = "flex items-center justify-center w-12 h-12 border-2 transition-all duration-300 rounded-none bg-zinc-800/50 border-zinc-700 text-zinc-700";
        span.textContent = '-';
    }
    indicator.appendChild(span);
}

function renderHistoryList() {
    const list = elements.historyList;
    if (state.hands.length === 0) {
        list.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-zinc-700 text-[10px] font-bold uppercase tracking-widest italic py-2"><span>No data</span></div>`;
        return;
    }

    list.innerHTML = '';
    [...state.hands].reverse().forEach(h => {
        const row = document.createElement('div');
        row.className = "grid grid-cols-12 gap-1 items-center px-4 py-2 border-b border-zinc-800/50 text-[11px] hover:bg-zinc-800/30 transition-colors h-10";
        
        const winnerClass = h.winner === Winner.PLAYER ? 'text-blue-500' : 'text-red-500';
        const cardClass = h.isFourCards ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' : 'text-zinc-500 border-zinc-800 bg-zinc-900';
        const predColor = h.prediction === Winner.PLAYER ? 'border-blue-900 text-blue-400' : 'border-red-900 text-red-400';
        const totalColor = h.runningTotal > 0 ? 'text-emerald-500' : h.runningTotal < 0 ? 'text-rose-500' : 'text-zinc-600';

        let resultIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-700"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        if (h.result === Result.WIN) resultIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>';
        if (h.result === Result.LOSS) resultIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-rose-500"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>';

        row.innerHTML = `
            <div class="col-span-1 text-zinc-600 font-mono">#${String(h.id).padStart(2, '0')}</div>
            <div class="col-span-4 flex items-center space-x-2">
                <span class="font-black tracking-tight ${winnerClass}">${h.winner.toUpperCase()}</span>
                <span class="text-[8px] font-black border px-1 ${cardClass}">${h.isFourCards ? '4C' : '5+C'}</span>
            </div>
            <div class="col-span-3 text-center">
                ${h.prediction ? `<span class="font-black px-1 border ${predColor}">${h.prediction === Winner.PLAYER ? 'P' : 'B'}</span>` : '<span class="text-zinc-800">-</span>'}
            </div>
            <div class="col-span-2 flex justify-center">${resultIcon}</div>
            <div class="col-span-2 text-right font-mono font-bold ${totalColor}">${h.runningTotal > 0 ? '+' : ''}${h.runningTotal}</div>
        `;
        list.appendChild(row);
    });
}

function updateChart() {
    if (!state.chart) return;
    
    const performanceData = state.hands.length > 0 
        ? [{ x: 0, y: 0 }, ...state.hands.map((h, idx) => ({ x: idx + 1, y: h.runningTotal }))]
        : [{ x: 0, y: 0 }];

    const maData = state.hands.length > 0
        ? [{ x: 0, y: null }, ...state.hands.map((h, idx) => {
            const period = 5;
            if (idx < period - 1) return { x: idx + 1, y: null };
            
            const start = idx - period + 1;
            const subset = state.hands.slice(start, idx + 1);
            const sum = subset.reduce((acc, curr) => acc + curr.runningTotal, 0);
            const ma = sum / period;
            return { x: idx + 1, y: ma };
        })]
        : [{ x: 0, y: null }];
    
    state.chart.data.datasets[0].data = maData;
    state.chart.data.datasets[1].data = performanceData;
    state.chart.update('none');
}

// --- Event Listeners ---
function attachEventListeners() {
    elements.btnMenuTrigger.addEventListener('click', openKeypad);
    elements.btnCloseKeypad.addEventListener('click', closeKeypad);
    elements.keypadBackdrop.addEventListener('click', closeKeypad);
    
    elements.btnPlayer.addEventListener('click', () => selectWinner(Winner.PLAYER));
    elements.btnBanker.addEventListener('click', () => selectWinner(Winner.BANKER));
    
    elements.btnYes.addEventListener('click', () => handleHandSubmit(state.selectedWinner, true));
    elements.btnNo.addEventListener('click', () => handleHandSubmit(state.selectedWinner, false));
    
    elements.btnUndo.addEventListener('click', handleUndo);
    
    elements.historyHeader.addEventListener('click', toggleHistory);
    
    elements.btnResetTrigger.addEventListener('click', openResetModal);
    elements.btnResetCancel.addEventListener('click', closeResetModal);
    elements.btnResetConfirm.addEventListener('click', handleReset);
}

// Kick off
init();