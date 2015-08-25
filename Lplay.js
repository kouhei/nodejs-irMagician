var fs = require('fs'),
    async = require('async'),
    serial = require('serialport'),
    SerialPort = serial.SerialPort,
    fileName,
    sp,
    port;

// 引数チェック
if (process.argv.length < 3) {
    throw 'missing file name';
}
fileName = process.argv[2];
port = process.argv[3] || '/dev/ttyACM0';


sp = new SerialPort(port, { baudrate: 9600 });

async.waterfall([
    function (callback) {
        'use strict';
        sp.on('open', function () {
            console.log('open');
            /*sp.on('data', function(data) {
                console.log('<data> received: ' + data+'</data>');
            });*/
            sp.on('close', function () {
                console.log('serial closed');
            });
            callback(null);
        });
    },
    function (callback) {
        'use strict';
        var jsonData
        console.log('jsonData reading...');

        try{
            jsonData = require(fileName);
        }catch(e){
            throw e;
        }
        console.log('recNumber : ' + jsonData.data.length);
        console.log('rawX : ' + jsonData.data);

        callback(null, jsonData);
    },
    function (jsonData, callback) {
        'use strict';
        var recNumber = jsonData.data.length,
            rawX = jsonData.data;
        console.log('write : n,' + recNumber);

        sp.write('n,' + recNumber + '\r\n', function (err) {
            //if (err !== undefined) {console.log('err : ' + err); }
            sp.drain(function () {
                callback(null, rawX, recNumber, jsonData);
            });
        });
    },
    function (rawX, recNumber, jsonData, callback) {
        'use strict';
        var postScale = jsonData.postscale;
        console.log('write : k,' + postScale);

        sp.write('k,' + postScale + '\r\n', function (err) {
            //if (err !== undefined) {console.log('err : ' + err); }
            sp.drain(function () {
                callback(null, recNumber, rawX);
            });
        });
    },
    function (recNumber, rawX, callback) {
        'use strict';
        var position = [],
            i,
            Pos;
        for (i = 0; i < recNumber; ++i) {
            Pos = {
                bank: Math.floor(i / 64),
                pos: i % 64
            };
            position.push(Pos);
        }
        console.log(position);
        callback(null, position, recNumber, rawX);
    },
    function (position, recNumber, rawX, callback) {
        'use strict';
        async.each(position, function (POS, callback) {

            var number = POS.bank * 64 + POS.pos;
            if (POS.pos === 0) {
                console.log('write : b,' + POS.bank);

                sp.write('b,' + POS.bank + '\r\n', function (err) {
                    //if (err !== undefined) {console.log('err : ' + err); }

                    sp.drain(function () {
                        console.log('write : w,' + POS.pos + ',' + rawX[number]);
                        sp.write('w,' + POS.pos + ',' + rawX[number] + '\n\r', function (err) {
                            //if (err !== undefined) {console.log('err : ' + err); }

                            sp.drain(function () {
                                sp.write('p\r\n', function (err) {
                                    //if (err !== undefined) {console.log('err : ' + err); }
                                    callback(null);
                                });

                            });

                        });
                    });

                });
            } else {
                console.log('write : w,' + POS.pos + ',' + rawX[number]);
                sp.write('w,' + POS.pos + ',' + rawX[number] + '\n\r', function (err) {
                    //if (err !== undefined) {console.log('err : ' + err); }

                    sp.drain(function () {
                        console.log('write : p');
                        sp.write('p\r\n', function (err) {
                            //if (err !== undefined) {console.log('err : ' + err); }
                            callback(null);
                        });
                    });
                });
            }

        }, function (err) {
            console.log('each all done.');
            callback(null);
        });
    }
], function (err) {
    'use strict';
    console.log('all done.');
    sp.close();
});
