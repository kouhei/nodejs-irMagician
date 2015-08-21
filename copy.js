var SerialPort = require('serialport').SerialPort,
    port = '',
    irMagician;

// 引数チェック
if (process.argv.length < 3) {
    console.log('port is \'/dev/ttyACM0\'');
    port = '/dev/ttyACM0';
}else{
    // 引数の内容を受け取る
    port = process.argv[2];
}

irMagician = new SerialPort(port, { baudrate: 9600 });//myMac:'/dev/tty.usbmodem0121' , raspi:'/dev/ttyACM0'

    irMagician.on('open', function () {
        console.log('open');
        
        irMagician.on('data', function (data) {
            console.log('data received: ' + data);
        });

        irMagician.write('c\r\n', function (err) {
            if (err) {console.log('err :' + err); }
        });

    });

};
