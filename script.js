/**
 * Air Paint Pro - Logic Engine 🚀
 * Developed by: Mazen
 */

const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const statusText = document.getElementById('status-text');
const welcomeMsg = document.getElementById('welcome-msg');
const loadingScreen = document.getElementById('loading');

let isDrawing = false;
let lastX = 0, lastY = 0;
let currentColor = '#00f2ff';

// ضبط الأبعاد والفرشاة
function init() {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    canvasCtx.lineCap = 'round';
    canvasCtx.lineJoin = 'round';
    canvasCtx.shadowBlur = 8;
    canvasCtx.shadowColor = currentColor;
}

window.addEventListener('resize', init);
init();

// تغيير الألوان
window.changeColor = (color) => { 
    currentColor = color; 
    canvasCtx.shadowColor = color;
};

// مسح اللوحة
window.clearCanvas = () => { 
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height); 
};

// حفظ الصورة
window.downloadImage = () => {
    const link = document.createElement('a');
    link.download = 'mazen-air-art.png';
    link.href = canvasElement.toDataURL();
    link.click();
};

function onResults(results) {
    if (loadingScreen) loadingScreen.style.display = 'none';

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        welcomeMsg.classList.remove('show');
        statusText.innerText = "لا توجد يد في الكاميرا";
        return;
    }

    const hand = results.multiHandLandmarks[0];
    const indexTip = hand[8];
    const indexBase = hand[5];
    const middleTip = hand[12];
    const ringTip = hand[16];
    const pinkyTip = hand[20];

    const x = indexTip.x * canvasElement.width;
    const y = indexTip.y * canvasElement.height;

    // --- منطق الإيماءات الاحترافي ---
    const isIndexUp = indexTip.y < indexBase.y;
    const isMiddleUp = middleTip.y < hand[9].y;
    const isRingDown = ringTip.y > hand[14].y;
    const isPinkyDown = pinkyTip.y > hand[18].y;

    // 1. إيماءة السلام (Hi Mazen) ✌️
    if (isIndexUp && isMiddleUp && isRingDown && isPinkyDown) {
        welcomeMsg.classList.add('show');
        statusText.innerText = "أهلاً مازن! ✌️";
        isDrawing = false;
    } 
    // 2. وضع الرسم (السبابة فقط) ✎
    else if (isIndexUp && !isMiddleUp) {
        welcomeMsg.classList.remove('show');
        statusText.innerText = "جاري الرسم ✎";
        
        if (!isDrawing) {
            isDrawing = true;
            [lastX, lastY] = [x, y];
        }

        canvasCtx.beginPath();
        canvasCtx.strokeStyle = currentColor;
        canvasCtx.lineWidth = 7;
        canvasCtx.moveTo(lastX, lastY);
        canvasCtx.lineTo(x, y);
        canvasCtx.stroke();
        [lastX, lastY] = [x, y];
    } 
    // 3. وضع الانتظار
    else {
        welcomeMsg.classList.remove('show');
        statusText.innerText = "وضع الانتظار";
        isDrawing = false;
    }
}

// إعداد مكتبة MediaPipe
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => { await hands.send({image: videoElement}); },
    width: 1280, height: 720
});
camera.start();
