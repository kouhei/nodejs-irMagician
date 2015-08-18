var fs = require('fs'),
    async = require('async'),
    SerialPort = require('serialport').SerialPort,
    fileName,
    serial;

// 引数チェック
if (process.argv.length < 3) {
    console.log('missing fileName.');
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
            callback(null);
        });
    },
    function(callback) {
        console.log('jsonData reading...');

        var jsonData = require(fileName);
        //console.log('json : '+json);

        callback(null,jsonData);
    },
    function(jsonData, callback) {
        var rawX = jsonData['data'];
        var recNumber = jsonData['data'].length;
        console.log('write : n,'+recNumber);

        serial.write('n,'+recNumber+'\n',function(err,Nres){
            if(err !== undefined){console.log('err : '+err);}
            console.log('Nres : '+Nres);
            callback(null,rawX,recNumber,jsonData);
        });
    },
    function(rawX,recNumber,jsonData, callback) {
        var postScale = jsonData['postscale'];
        console.log('write : k,'+postScale);

        serial.write('k,'+postScale+'\n',function(err,Kres){
            if(err !== undefined){console.log('err : '+err);}
            console.log('Kres : '+Kres);

            callback(null,recNumber,rawX);
        });
    },
    function(recNumber,rawX, callback){
        var position = [];
        for(var i=0;i < recNumber;i++){
            var Pos = {};
            Pos.bank = parseInt(i/64);
            Pos.pos = i%64;
            position.push(Pos);
        }
        callback(null,position,recNumber,rawX);
    },
    function(position,recNumber,rawX,callback){
        async.each(position, function(POS, callback){
            // 処理1
            var number = POS['bank']*64+POS['pos'];
            //console.log('write : b,'+POS['bank']);
            serial.write('b,'+POS['bank']+'\n',function(err,Bres){
                if(err !== undefined){console.log('err : '+err);}
                //if(Bres !== undefined){console.log('Bres : '+Bres);}
                //callback(null,position,rawX);

                //console.log('write : w,'+POS['pos']+','+rawX[number]);
                serial.write('w,'+POS['pos']+','+rawX[number]+'\n',function(err,Wres){
                    if(err !== undefined){console.log('err : '+err);}
                    //if(Wres !== undefined){console.log('Wres : '+Wres);}
                    //callback(null);

                    //console.log('write : p');
                    serial.write('p\n',function(err,Pres){
                        if(err !== undefined){console.log('err : '+err);}
                        //if(Pres !== undefined){console.log('Pres : '+Pres);}
                        callback(null);
                    });

                });

            });

        }, function(err){
            //処理2
            if(err) throw err;

            console.log('async.each all done.');
            callback(null);
        });
    }
], function(err) {
    if (err) {
        throw err;
    }
    console.log('all done.');
    serial.close();
    console.log('serial closed');
});



/*function(position,recNumber,rawX,callback){
    async.each(position, function(n, callback){
        // 処理1
        console.log('write : b,'+position[n]['bank']);
        serial.write('b,'+position[n]['bank']+'\n',function(err){
            if(err !== undefined){console.log('err : '+err);}
            //callback(null,position,rawX);

            console.log('write : w,'+position[n]['pos']+','+rawX[n]);
            serial.write('w,'+position[n]['pos']+','+rawX[n]+'\n',function(err){
                if(err !== undefined){console.log('err : '+err);}
                //callback(null);

                console.log('write : p');
                serial.write('p\n',function(err){
                    if(err !== undefined){console.log('err : '+err);}
                    callback();
                });

            });

        });

    }, function(err){
        //処理2
        if(err) throw err;

        console.log('async.each all done.');
        callback(null);
    });
}
*/
/*
function(recNumber,rawX, callback) {

    console.log('write : b,'+position[0]['bank']);

    serial.write('b,'+position[0]['bank']+'\n',function(err){
        if(err !== undefined){console.log('err : '+err);}
        callback(null,position,rawX);
    });
},
    function(position,rawX, callback) {
        console.log('write : w,'+position[0]['pos']+','+rawX[0]);

        serial.write('w,'+position[0]['pos']+','+rawX[0]+'\n',function(err){
            if(err !== undefined){console.log('err : '+err);}
            callback(null);
        });
    },
        function(callback) {
            console.log('write : p');

            serial.write('p\n',function(err){
                if(err !== undefined){console.log('err : '+err);}
                callback(null);
            });
        }
*/
