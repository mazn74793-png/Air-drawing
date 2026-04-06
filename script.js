const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');

// إعداد أبعاد الـ Canvas
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

let isDrawing = false;
let lastX = 0;
let lastY = 0;

// دالة لمعالجة النتائج من MediaPipe
function onResults(results) {
    // تنظيف إطار العمل الخاص بالتعرف على اليد (اختياري، لا نمسح لوحة الرسم هنا)
    if (!results.multiHandLandmarks) return;

    for (const landmarks of results.multiHandLandmarks) {
        // نقطة طرف السبابة هي رقم 8، ونقطة مفصل السبابة رقم 5
        const indexFingerTip = landmarks[8];
        const indexFingerBase = landmarks[5];
        
        // نقاط الأصابع الأخرى لتحديد هل الكف مفتوح (للمسح)
        const middleFingerTip = landmarks[12];
        const ringFingerTip = landmarks[16];
        const pinkyFingerTip = landmarks[20];

        // تحويل الإحداثيات النسبية إلى بكسلات
        const x = indexFingerTip.x * canvasElement.width;
        const y = indexFingerTip.y * canvasElement.height;

        // 1. منطق المسح: إذا كانت جميع الأصابع أعلى من مفاصلها (اليد مفتوحة)
        if (indexFingerTip.y < indexFingerBase.y && middleFingerTip.y < landmarks[9].y && ringFingerTip.y < landmarks[13].y) {
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            isDrawing = false;
        } 
        // 2. منطق الرسم: إذا كان السبابة فقط مرفوعاً (تبسيط: نقارن السبابة بالوسطى)
        else if (indexFingerTip.y < indexFingerBase.y) {
            if (!isDrawing) {
                isDrawing = true;
                [lastX, lastY] = [x, y];
            }
            draw(x, y);
        } else {
            isDrawing = false;
        }
    }
}

// دالة الرسم على الـ Canvas
function draw(x, y) {
    canvasCtx.beginPath();
    canvasCtx.strokeStyle = '#00ffcc'; // لون الرسم
    canvasCtx.lineWidth = 5;
    canvasCtx.lineCap = 'round';
    canvasCtx.moveTo(lastX, lastY);
    canvasCtx.lineTo(x, y);
    canvasCtx.stroke();
    [lastX, lastY] = [x, y];
}

// إعداد مكتبة Hands
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

// تشغيل الكاميرا
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 1280,
    height: 720
});
camera.start();
