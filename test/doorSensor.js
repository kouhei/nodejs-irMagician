var fs = require('fs'),
    color = require('../src/color'),
    //http = require('http'),
    //server = {},
    IRMagician = require('../irMagician'),
    irMagician = {},
    port = '',

    SerialPort = require('serialport').SerialPort,
    arduino,

    closeCount = 0,
    lightJudge = function(){};//つけるか消すか

arduino = new SerialPort('/dev/ttyACM0');
irMagician = new IRMagician('/dev/ttyACM1');//MEMO:arduinoと同時に繋いだ時

lightJudge = function(){//FIXME:引数にcountとしてcloseCountをインクリメントすると挙動がおかしい
  var dataName = '';
  closeCount++;
  //console.log('count' + closeCount);
  if(closeCount % 2 === 1){
    dataName = '../json/lightOn.json';
  }else{
    dataName = '../json/lightOff.json';
  }
  irMagician.Lplay(dataName, function(){console.log('Lplay end callback');});
};

arduino.on('open', function(){
    console.log(color.info('arduino is opened'));

    arduino.on('data', function(data){
        console.log('<data>' + data + '</data>');
        data += '';//Object => String
        switch(data){
          case '0\n' : console.log(color.info('door is closed')); break;
          case '1\n' : console.log(color.info('door is opened')); lightJudge(); break;
          default:console.log(color.error('error'));
        }
    });

    arduino.on('close', function(){
        console.log(color.warning('arduino is closed'));
    });
});
