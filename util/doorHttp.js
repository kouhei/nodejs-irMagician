/*

コマンドライン引数として、メールの受信者のアドレス,メール送信者のアドレス,メール送信者のパスワードがいる
example: node yourGmailAddress@gmail.com subitterGmailAddress@gmail.com submitter'sPassword
NOTE:メールは両方ともgmailのみ可

*/

process.on('exit', function () {
  console.log('exit.');
});

var fs = require('fs'),
    color = require('../src/color'),
    IRMagician = require('../irMagician'),
    irMagician = {},
    port = '',

    SerialPort = require('serialport').SerialPort,
    arduino,

    closeCount = 0,
    lightJudge = function(){},//つけるか消すか

    Mailer = require('../src/mailer'),
    mailer,

    getPost = require('../src/GetPost'),

    GetDate = require('../src/getDate'),
    getDate = new GetDate();


arduino = new SerialPort('/dev/ttyACM1');
irMagician = new IRMagician('/dev/ttyACM0');//arduinoと同時に繋いだ時

//mailerのユーザー名などが与えられた時
if(process.argv[2] && process.argv[3] && process.argv[4]){
  mailer = new Mailer(process.argv[2], process.argv[3], process.argv[4]);
  mailer.send('Starting doorHttp.js');
}else{
  console.log(color.error('mailer is not defined!'));
}

//onかoffかの判定
//boool : ONかOFF(optional)
lightJudge = function(bool){
  var dataName = '';
  if(!lightJudge.closeCount){
    lightJudge.closeCount = 0;
  }
  lightJudge.closeCount++;

  if(bool){

    if(bool === 'ON'){
      dataName = '../json/lightOn.json';
      if(lightJudge.closeCount % 2 !== 1){
        lightJudge.closeCount++;
      }
    }else{
      if(bool === 'OFF'){
        dataName = '../json/lightOff.json';
        if(lightJudge.closeCount % 2 !== 0){
          lightJudge.closeCount++;
        }
      }
    }
  }else{
    if(lightJudge.closeCount % 2 === 1){
      dataName = '../json/lightOn.json';
    }else{
      dataName = '../json/lightOff.json';
    }
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
            console.log(color.info('[' + getDate.getTime()+'] door is opened'));
            if (mailer) { mailer.send('Door is opened.'); }
            lightJudge();
            break;
          case '' : break;
          default:console.log(color.error('error'));
        }
    });

    arduino.on('close', function(){
        console.log(color.warning('arduino is closed'));
    });
});

getPost(irMagician, lightJudge, 8080);
