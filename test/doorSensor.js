/*

引数として、メールの受信者のアドレス,メール送信者のアドレス,メール送信者のパスワードがいる
※メールは両方ともgmailのみ可

*/
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
    lightJudge = function(){},//つけるか消すか

    Mailer = require('../src/mailer'),
    mailer,
    mailerPass;

arduino = new SerialPort('/dev/ttyACM0');
irMagician = new IRMagician('/dev/ttyACM1');//MEMO:arduinoと同時に繋いだ時

if(process.argv[2] && process.argv[2] && process.argv[2]){
  mailer = new Mailer(process.argv[2], process.argv[3], process.argv[4]);
  mailer.send();
}else{
  console.log(color.error('mailer is not defined!'));
}


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
          case '0\n' :
          case '0' : console.log(color.info('door is closed')); break;
          case '1\n' :
          case '1' :
            console.log(color.info('door is opened'));
            if (mailer) { mailer.send(); }
            lightJudge();
            break;
          default:console.log(color.error('error'));
        }
    });

    arduino.on('close', function(){
        console.log(color.warning('arduino is closed'));
    });
});
//TODO:mailer.sendに引数として送るメッセージの内容をつけるようにする
