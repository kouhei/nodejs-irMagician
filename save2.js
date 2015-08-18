var fs = require('fs'),
    async = require('async'),
    SerialPort = require('serialport').SerialPort,
    rawX = [],
    postScale,
    recNumber,
    postJudge=false,
    fileName,
    irMagician;


// 引数チェック
if (process.argv.length < 3) {
    console.log('missing argument.');
}
// 引数の内容を受け取る
fileName = process.argv[2];


var irMagician = new SerialPort('/dev/tty.usbmodem0121', { baudrate: 9600 });//for mac
//irMagician = new SerialPort('/dev/ttyACM0', { baudrate: 9600 });


irMagician.on('open', function () {
    console.log('open');
    irMagician.on('data', function(data) {
        console.log('<data> received: ' + data+'</data>');
    });


    irMagician.write('I,1\n', function(err, I1results) {//赤外線信号の変化点 (L/Hの切り替わり)の数
        if(err !== undefined){
            console.log('I1err ' + err);
        }
        console.log('<I,1> : ' + I1results+'</I,1>');
        recNumber = parseInt(I1results,16);


        irMagician.write('I,6\n', function(err, I6results){//postScalerの値
            if(err !== undefined){
                console.log('I6err ' + err);
            }
            console.log('<I,6> : ' + I6results+'</I,6>');
            postScale = parseInt(I6results,10);

            var count = 0;
            for(var i=0;i < recNumber;i++){

                console.log('i :'+i);
                var bank = Math.floor(i/64);
                console.log('bank : '+bank);
                var post = i%64;
                console.log('post : '+post);
                if(post === 0){

                    async.waterfall([
                        function(callback){
                            irMagician.write('b,'+bank+'\n',function(err,bresults){
                                if(err !== undefined){
                                    console.log('berr ' + err);
                                }
                                console.log('<b> : '+bresults+'</b>');

                                callback(null);
                            });

                        },
                        function(callback){
                            irMagician.write('d,'+post+'\n',function(err,dresults){
                                if(err !== undefined){
                                    console.log('derr ' + err);
                                }
                                console.log('<d> : '+dresults+'</d>');
                                dresults += "";
                                var xStr = dresults.slice(0,3);
                                var xData = parseInt(xStr,16);
                                rawX.push(xData);

                                callback(null, i);
                            });
                        }
                    ], function (err, result) {
                        if(err) {
                            throw err;
                        }
                        console.log('waterfall all done. ',i);
                    });

                }
                else{

                    async.waterfall([
                        function(callback){
                            irMagician.write('d,'+post+'\n',function(err,dresults){
                                if(err !== undefined){
                                    console.log('derr ' + err);
                                }
                                console.log('<d> : '+dresults+'</d>');
                                dresults += "";
                                var xStr = dresults.slice(0,3);
                                var xData = parseInt(xStr,16);
                                rawX.push(xData);
                                callback(null,'next')
                            });
                        }
                    ], function (err, result) {
                        if(err) {
                            throw err;
                        }
                        console.log('waterfall all done. ',i);


                        if(rawX !== []){
                            console.log("make jsonData...");
                            console.log('rawX : '+rawX);
                            var jsonData = {
                                postscale:postScale,
                                freq:38,
                                data:rawX,
                                format:'raw'
                            };

                            fs.writeFileSync(fileName, JSON.stringify(jsonData, null, '    '));
                            console.log("success!");
                            console.log('rawX :'+rawX);
                        }else{
                            console.log("rawX is Null! or count is 0");
                        }


                    });

                }

            }

        });

    });
});
