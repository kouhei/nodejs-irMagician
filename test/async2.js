var fs = require('fs'),
    async = require('async'),
    SerialPort = require('serialport').SerialPort,
    rawX = [],
    dataReqPos = [],
    postJudge=false,
    postScale,
    recNumber,
    fileName,
    serial;

serial = new SerialPort('/dev/tty.usbmodem0121', { baudrate: 9600 });//for mac
//serial = new SerialPort('/dev/ttyACM0', { baudrate: 9600 });



async.waterfall([
    function(callback) {
        serial.on('open',function(){
            console.log('open');
            callback(null);
        });

    },
    function(callback) {
        setTimeout(function(){
            serial.on('data',function(data){
                console.log('data : '+data);
            });
            callback(null);
        },3000);

    },
    function(callback) {
        console.log('write : I,1');
        serial.write('I,1\n',function(err,I1res){
            if(err) {console.log('I1err : '+err);}
            console.log(I1res);
            recNumber = parseInt(I1res,16);
            console.log('recNumber : '+recNumber);

            callback(null,recNumber);
        });

    },
    function(recNumber, callback) {
        console.log('write : I,6');
        serial.write('I,6\n', function(err, I6res){
            if(err) {console.log('I1err : '+err);}
            postScale = parseInt(I6res,10);
            console.log('postScale : '+postScale);

            callback(null,recNumber,postScale);
        });

    }
], function(err, recNumber, postScale) {
    if (err) { throw err;}
    console.log('all done.');
    for(var i=0;i<recNumber;i++){
        var pos = i%64;
        dataReqPos.push(pos);
    }
    console.log('position : '+dataReqPos);
    serial.close();
});





/*
var a = [1,2,3,4,5,6,7,8,9,10];

var sent = "";
async.each(a, function(i, callback){
    // 処理1
    setTimeout(function() {
        sent += 'number ' + i + '\n';
        callback();
    }, 1000);

}, function(err){
    //処理2
    if(err) throw err;

    console.log(sent);
});
*/
