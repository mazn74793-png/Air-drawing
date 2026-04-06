/**
 * Air Drawing Pro - Logic Engine
 * Developed for: Mazen (Full-stack Developer)
 */

const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const loadingScreen = document.getElementById('loading');
const modeText = document.getElementById('mode-text');

let isDrawing = false;
let lastX = 0;
let lastY = 0;

// إعدادات الكانفاس والفرشاة
function initCanvas() {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    canvasCtx.strokeStyle = '#00f2ff'; // لون فسفوري احترافي
    canvasCtx.lineWidth = 6;
    canvasCtx.lineCap = 'round';
    canvasCtx.lineJoin = 'round';
    // تأثير توهج للخط (Glow Effect)
    canvasCtx.shadowBlur = 10;
    canvasCtx.shadowColor = '#00f2ff';
}

window.addEventListener('resize', initCanvas);
initCanvas();

function clearCanvas() {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
}

function onResults(results) {
    // إخفاء شاشة التحميل عند بدء العمل
    if (loadingScreen) loadingScreen.style.display = 'none';

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // النقاط الأساسية (Landmarks)
        const indexTip = landmarks[8];  // طرف السبابة
        const indexBase = landmarks[5]; // قاعدة السبابة
        const middleTip = landmarks[12]; // طرف الوسطى
        const ringTip = landmarks[16];   // طرف البنصر

        // تحويل الإحداثيات لمقاس الشاشة
        const x = indexTip.x * canvasElement.width;
        const y = indexTip.y * canvasElement.height;

        // --- منطق التحكم الاحترافي ---

        // 1. وضع المسح: لو السبابة والوسطى والبنصر مرفوعين (كف مفتوح)
        if (indexTip.y < indexBase.y && middleTip.y < landmarks[9].y && ringTip.y < landmarks[13].y) {
            clearCanvas();
            updateUI("جاري المسح...", "#ff4757");
            isDrawing = false;
        }
        // 2. وضع الرسم: لو السبابة فقط مرفوع (والوسطى مطوي)
        else if (indexTip.y < indexBase.y && middleTip.y > landmarks[9].y) {
            updateUI("وضع الرسم ✎", "#00f2ff");
            
            if (!isDrawing) {
                isDrawing = true;
                [lastX, lastY] = [x, y];
            }

            canvasCtx.beginPath();
            canvasCtx.moveTo(lastX, lastY);
            canvasCtx.lineTo(x, y);
            canvasCtx.stroke();
            [lastX, lastY] = [x, y];
        } 
        // 3. وضع الانتظار
        else {
            updateUI("في انتظار إشارة إيدك...", "#fff");
            isDrawing = false;
        }
    }
}

function updateUI(text, color) {
    if (modeText) {
        modeText.innerText = text;
        modeText.style.color = color;
    }
}

// إعداد MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.75,
    minTrackingConfidence: 0.75
});

hands.onResults(onResults);

// تشغيل الكاميرا مع دعم الموبايل
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 1280,
    height: 720
});

camera.start().catch(err => {
    console.error("Camera Error: ", err);
    alert("تأكد من إعطاء صلاحية الكاميرا وفتح الرابط عبر HTTPS");
});
