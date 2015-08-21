var fs = require('fs'),
    async = require('async'),
    SerialPort = require('serialport').SerialPort,
    fileName,
    serial;

// 引数チェック
if (process.argv.length < 3) {
    throw 'missing fileName.';
}
// 引数の内容を受け取る
fileName = process.argv[2];

//serial = new SerialPort('/dev/tty.usbmodem0121', { baudrate: 9600 });//for mac
serial = new SerialPort('/dev/ttyACM0', { baudrate: 9600 });

async.waterfall([
    function(callback){
        serial.on('open', function () {
            console.log('open');
            /*serial.on('data', function(data) {
                console.log('<data> received: ' + data+'</data>');
            });*/
            serial.on('close',function(){
                console.log('serial closed');
            });
            callback(null);
        });
    },
    function(callback) {
        console.log('jsonData reading...');

        var jsonData = require(fileName);
        //console.log('json : '+json);
        console.log('recNumber : '+jsonData['data'].length);
        console.log('rawX : '+jsonData['data']);

        callback(null,jsonData);
    },
    function(jsonData, callback) {
        var recNumber = jsonData['data'].length;
        var rawX = jsonData['data'];
        console.log('write : n,'+recNumber);

        serial.write('n,'+recNumber+'\r\n',function(err){
            if(err !== undefined){console.log('err : '+err);}
            serial.drain(function(){
                callback(null,rawX,recNumber,jsonData);
            });
        });
    },
    function(rawX,recNumber,jsonData, callback) {
        var postScale = jsonData['postscale'];
        console.log('write : k,'+postScale);

        serial.write('k,'+postScale+'\r\n',function(err){
            if(err !== undefined){console.log('err : '+err);}
            serial.drain(function(){
                callback(null,recNumber,rawX);
            });
        });
    },
    function(recNumber,rawX, callback){
        var position = [];
        for(var i=0;i < recNumber;i++){
            var Pos = {
                bank: Math.floor(i/64),
                pos:i%64
            };
            //Pos['bank'] = parseInt(i/64);
            //Pos.['pos'] = i%64;
            position.push(Pos);
        }
        console.log(position);
        callback(null,position,recNumber,rawX);
    },
    function(position,recNumber,rawX,callback){
        async.each(position, function(POS, callback){

            var number = POS['bank']*64+POS['pos'];
            if(POS['pos'] === 0){
                console.log('write : b,'+POS['bank']);

                serial.write('b,'+POS['bank']+'\r\n',function(err){
                    if(err !== undefined){console.log('err : '+err);}

                    serial.drain(function(){
                        console.log('write : w,'+POS['pos']+','+rawX[number]);
                        serial.write('w,'+POS['pos']+','+rawX[number]+'\n\r',function(err){
                            if(err !== undefined){console.log('err : '+err);}

                            serial.drain(function(){
                                //console.log('write : p');
                                serial.write('p\r\n',function(err){
                                    if(err !== undefined){console.log('err : '+err);}
                                    callback(null);
                                });

                            });

                        });
                    });

                });
            }else{

                console.log('write : w,'+POS['pos']+','+rawX[number]);
                serial.write('w,'+POS['pos']+','+rawX[number]+'\n\r',function(err){
                    if(err !== undefined){console.log('err : '+err);}

                    serial.drain(function(){
                        console.log('write : p');
                        serial.write('p\r\n',function(err){
                            if(err !== undefined){console.log('err : '+err);}
                            callback(null);
                        });
                    });
                });
            }

        },function(err){

            console.log('each all done.');
            callback(null);
        });
    }
], function(err) {
    console.log('all done.');
    serial.close();
});
