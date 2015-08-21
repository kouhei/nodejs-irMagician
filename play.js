var SerialPort = require('serialport').SerialPort,
    port,
    sp;

// 引数チェック
if (process.argv.length < 3) {
    console.log('port is \'/dev/ttyACM0\'');
    port = '/dev/ttyACM0';
}else{
    // 引数の内容を受け取る
    port = process.argv[2];
}

//sp = new SerialPort("/dev/tty.usbmodem0121", { baudrate: 9600 });//for mac
sp = new SerialPort(port, { baudrate: 9600 });
sp.on('open', function () {
    console.log('open');
    sp.on('data', function(data) {
        console.log('data received: ' + data);
    });

    sp.write('p\r\n', function(err) {
    	if(err){ console.log('err ' + err); }
    });
    
});
