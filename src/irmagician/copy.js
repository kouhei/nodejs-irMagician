var serial = require('serialport'),
    SerialPort = serial.SerialPort,
    port = '',
    sp,
    re = /[0-640]/;

// 引数チェック
if (process.argv.length < 3) {
    console.log('port is \'/dev/ttyACM0\'');
    port = '/dev/ttyACM0';
} else {
    // 引数の内容を受け取る
    port = process.argv[2];
}

sp = new SerialPort(port, { baudrate: 9600 });//myMac:'/dev/tty.usbmodem0121' , raspi:'/dev/ttyACM0'

sp.on('open', function () {
    'use strict';
    console.log('open');

    sp.on('close', function () {
        console.log('serial closed');
    });

    sp.on('data', function (data) {
        console.log('data received:' + data);
        if (re.test(data)) {
            sp.close();
        }
    });

    sp.write('c\r\n', function (err) {
        if (err) {console.log('err :' + err); }
    });

});
