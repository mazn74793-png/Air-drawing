/**
 * Air Paint Ultra - The Engine 🧠
 * Features: Multi-hand control, Pinch-to-size, Rainbow Neon, Gesture Recognition.
 */

const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const thicknessBar = document.getElementById('thickness-bar');
const welcomeMsg = document.getElementById('welcome-msg');
const statusText = document.getElementById('status');
const loadingScreen = document.getElementById('loading');

let isDrawing = false;
let lastX = 0, lastY = 0;
let lineWidth = 10;
let hue = 0;

// إعداد الكانفاس
function initCanvas() {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    canvasCtx.lineCap = 'round';
    canvasCtx.lineJoin = 'round';
}
window.addEventListener('resize', initCanvas);
initCanvas();

// دوال التحكم العامة
window.clearCanvas = () => canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

window.downloadImage = () => {
    const link = document.createElement('a');
    link.download = 'mazen-air-art.png';
    link.href = canvasElement.toDataURL();
    link.click();
};

// المعالجة الأساسية
function onResults(results) {
    if (loadingScreen) loadingScreen.style.display = 'none';
    
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        statusText.innerText = "لا توجد يد في الكاميرا";
        welcomeMsg.classList.remove('show');
        return;
    }

    let rightHand = null;
    let leftHand = null;

    // تحديد اليد اليمنى واليسرى بدقة
    results.multiHandLandmarks.forEach((landmarks, index) => {
        const label = results.multiHandedness[index].label;
        // ملاحظة: MediaPipe يعكس التسميات أحياناً، لذا نعتمد التسمية المباشرة
        if (label === "Right") rightHand = landmarks; 
        if (label === "Left") leftHand = landmarks;
    });

    // 1. التحكم في السُمك (اليد اليسرى) 🤏
    if (leftHand) {
        const thumbTip = leftHand[4];
        const indexTip = leftHand[8];
        const dist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        
        lineWidth = Math.max(2, Math.min(dist * 250, 50)); // تحديد حدود للسُمك
        thicknessBar.style.width = (lineWidth * 2) + "%";
        statusText.innerText = "تحكم في السُمك نشط ✅";
    }

    // 2. الرسم والترحيب (اليد اليمنى) ✎
    if (rightHand) {
        const indexTip = rightHand[8];
        const indexBase = rightHand[5];
        const middleTip = rightHand[12];
        const ringTip = rightHand[16];
        
        const x = indexTip.x * canvasElement.width;
        const y = indexTip.y * canvasElement.height;

        const isIndexUp = indexTip.y < indexBase.y;
        const isMiddleUp = middleTip.y < rightHand[9].y;
        const isRingDown = ringTip.y > rightHand[14].y;

        // إيماءة الترحيب (صباعين مرفوعين وباقي الأصابع مطوية) ✌️
        if (isIndexUp && isMiddleUp && isRingDown) {
            welcomeMsg.classList.add('show');
            statusText.innerText = "أهلاً يا مازن! ✌️";
            isDrawing = false;
        } 
        // وضع الرسم (السبابة فقط)
        else if (isIndexUp && !isMiddleUp) {
            welcomeMsg.classList.remove('show');
            statusText.innerText = "جاري الرسم بالنيون... ✨";
            
            if (!isDrawing) {
                isDrawing = true;
                [lastX, lastY] = [x, y];
            }

            // تأثير قوس قزح المتغير
            hue = (hue + 2) % 360;
            canvasCtx.beginPath();
            canvasCtx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
            canvasCtx.lineWidth = lineWidth;
            canvasCtx.shadowBlur = 15;
            canvasCtx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            
            canvasCtx.moveTo(lastX, lastY);
            canvasCtx.lineTo(x, y);
            canvasCtx.stroke();
            [lastX, lastY] = [x, y];
        } else {
            isDrawing = false;
            welcomeMsg.classList.remove('show');
            statusText.innerText = "وضع الانتظار...";
        }
    }
}

// إعداد مكتبة Hands
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 2, // مهم جداً عشان نستخدم اليدين
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => { await hands.send({image: videoElement}); },
    width: 1280, height: 720
});
camera.start();
