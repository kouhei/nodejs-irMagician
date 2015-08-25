var color = require('./color'),
    serial = require('serialport'),
    SerialPort = serial.SerialPort,
    portName,
    sp;

// 引数チェック
if (process.argv.length < 3) {
    console.log('port is \'/dev/ttyACM0\'');
    portName = '/dev/ttyACM0';
} else {
    // 引数の内容を受け取る
    portName = process.argv[2];
}

serial.list(function (err, ports) {
    'use strict';
    var portJudge = false;
    ports.forEach(function (port) {
        if (port.comName === portName) {
            portJudge = true;//そのポートはある
        }
    });
    if (!portJudge) {
        throw color.red + 'port \'' + portName + '\' is not found' + color.reset;
    } else {

        sp = new SerialPort(portName, { baudrate: 9600 });
        sp.on('open', function () {
            console.log('open');

            sp.on('data', function (data) {
                console.log('data received:' + data);
                if (data + '' === '... Done !\r\n' || data + '' === ' Done !\r\n') {
                    sp.close();
                } else {
                    console.log(data + '');//test
                    console.log(data);
                    //console.log(new Buffer('... Done !\r\n'));
                    //console.log(new Buffer(' Done !\r\n'));
                }
            });
            sp.on('close', function () { console.log('serial closed'); });

            sp.write('p\r\n', function (err) {
                if (err) { throw 'error (writing p\\r\\n) :' + err; }
            });

        });
    }
});
