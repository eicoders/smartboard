const canvas = document.getElementById('smartBoard');
const ctx = canvas.getContext('2d');

// Toolbar ke elements
const colorPicker = document.getElementById('colorPicker');
const lineWidth = document.getElementById('lineWidth');
const penBtn = document.getElementById('penBtn');
const eraserBtn = document.getElementById('eraserBtn');
const clearBtn = document.getElementById('clearBtn');

// Variables
let isDrawing = false;
let currentMode = 'pen'; // 'pen' ya 'eraser'
let lastX = 0;
let lastY = 0;

// Canvas ko full screen karne ka function
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Default white background set karna
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Pehli baar run karne ke liye

// Drawing start karna
function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;
}

// Drawing continue rakhna
function draw(e) {
    if (!isDrawing) return;
    e.preventDefault(); // Mobile par screen scroll hone se rokne ke liye

    const pos = getMousePos(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    
    ctx.lineCap = 'round'; // Line ke edges smooth karne ke liye
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth.value;

    if (currentMode === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = colorPicker.value;
    } else if (currentMode === 'eraser') {
        // Eraser mode: transparent kar deta hai
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)'; 
    }

    ctx.stroke();

    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing() {
    isDrawing = false;
}

// Mouse ya Touch ki exact position nikalna
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (e.touches) { // Agar mobile/tablet hai
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else { // Agar laptop/PC hai
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
    return { x, y };
}

// Mouse Events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch Events (Mobile/Tablet)
canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDrawing);

// Toolbar Buttons Logic
penBtn.addEventListener('click', () => {
    currentMode = 'pen';
    penBtn.classList.add('active');
    eraserBtn.classList.remove('active');
});

eraserBtn.addEventListener('click', () => {
    currentMode = 'eraser';
    eraserBtn.classList.add('active');
    penBtn.classList.remove('active');
});

clearBtn.addEventListener('click', () => {
    // Pura board clean karna
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});