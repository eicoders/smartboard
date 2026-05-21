const canvas = document.getElementById('smartBoard');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// Toolbar Elements
const colorPicker = document.getElementById('colorPicker');
const lineWidth = document.getElementById('lineWidth');
const toolBtns = document.querySelectorAll('.tool-btn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const clearBtn = document.getElementById('clearBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const downloadBtn = document.getElementById('downloadBtn');

// Variables
let isDrawing = false;
let currentTool = 'pen';
let startX, startY;
let snapshot;

// History for Undo/Redo
let historyArray = [];
let historyIndex = -1;

// --- CRITICAL FIX: High-DPI Canvas Scaling for Smooth Handwriting ---
function resizeCanvas() {
    // Get device pixel ratio (usually 2 or 3 on modern phones/Macs)
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual size in memory (scaled up)
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    // Set display size (normal)
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    
    // Normalize coordinate system to use css pixels
    ctx.scale(dpr, dpr);
    
    setWhiteBackground();
    if(historyIndex >= 0) {
        restoreCanvas(historyArray[historyIndex]);
    }
}

function setWhiteBackground() {
    ctx.fillStyle = '#ffffff';
    // Use window dimensions because we scaled the context
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight); 
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
saveState(); // Save initial blank state

// --- Drawing Logic ---
function getMousePos(e) {
    // Get exact coordinates regardless of scaling
    let x = e.clientX || (e.touches && e.touches[0].clientX);
    let y = e.clientY || (e.touches && e.touches[0].clientY);
    return { x, y };
}

function startDrawing(e) {
    // Prevent drawing if clicking on toolbar
    if (e.target.closest('.toolbar')) return; 

    isDrawing = true;
    const pos = getMousePos(e);
    startX = pos.x;
    startY = pos.y;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    // Save snapshot for shapes preview
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault(); 
    const pos = getMousePos(e);

    // Settings for smooth lines
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth.value;

    if (currentTool === 'pen' || currentTool === 'eraser') {
        ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : colorPicker.value;
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    } else {
        // Shapes Logic (Restore previous state, then draw new shape)
        ctx.putImageData(snapshot, 0, 0);
        ctx.strokeStyle = colorPicker.value;
        
        if (currentTool === 'line') {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (currentTool === 'rect') {
            ctx.beginPath();
            ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
        } else if (currentTool === 'circle') {
            ctx.beginPath();
            let radius = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
            ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveState();
    }
}

// Event Listeners for Drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Mobile Touch Support
canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDrawing);

// --- Toolbar Logic ---
toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.tool-btn.active').classList.remove('active');
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
    });
});

// Undo / Redo / Clear
function saveState() {
    if (historyIndex < historyArray.length - 1) {
        historyArray = historyArray.slice(0, historyIndex + 1);
    }
    historyArray.push(canvas.toDataURL());
    historyIndex++;
}

function restoreCanvas(dataUrl) {
    let img = new Image();
    img.src = dataUrl;
    img.onload = () => {
        setWhiteBackground();
        ctx.drawImage(img, 0, 0, window.innerWidth, window.innerHeight);
    }
}

undoBtn.addEventListener('click', () => {
    if (historyIndex > 0) {
        historyIndex--;
        restoreCanvas(historyArray[historyIndex]);
    }
});

redoBtn.addEventListener('click', () => {
    if (historyIndex < historyArray.length - 1) {
        historyIndex++;
        restoreCanvas(historyArray[historyIndex]);
    }
});

clearBtn.addEventListener('click', () => {
    setWhiteBackground();
    saveState();
});

// --- Fullscreen Feature ---
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error: ${err.message}`);
        });
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    }
});

// Download Feature
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `JarBoard-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
});