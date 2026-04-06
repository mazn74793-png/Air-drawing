const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
// السماح بالاتصال من أي مكان لتسهيل التجربة
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log('جهاز جديد متصل، ID:', socket.id);

    // استلام الأمر من لوحة التحكم
    socket.on('send_command', (command) => {
        console.log('أمر مستلم:', command);
        // إعادة إرسال الأمر للجهاز الهدف (التابلت/الموبايل)
        io.emit('execute_command', command); 
    });

    socket.on('disconnect', () => {
        console.log('جهاز انفصل');
    });
});

server.listen(3000, () => {
    console.log('السيرفر شغال ومستعد لنقل الأوامر على بورت 3000');
});
