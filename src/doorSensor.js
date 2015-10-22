/*
irMagician  :
arduino     :
processings : [0:arduinoからデータが送られた時の処理(必須)(function) ,1:irMagicianの処理が終わった時の処理(optional)(function)]
  example:(processings[0])
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
*/
var doorSensor = function(irMagician, arduino,processings){
  var color = require('./color'),

      closeCount = 0,
      lightJudge = function(){};//つけるか消すか

  if(!irMagician){
    throw color.error('(doorSensor.js)irMagician is undefined!!!');
  }
  if(!arduino){
    throw color.error('(doorSensor.js)arduino is undefined!!!');
  }
  if(processings){
    if(!processings[0]){
      throw color.error('(doorSensor.js)processings[0] is undefined!!!');
    }
    if(!processings[1]){
      processings[1] = function(){console.log('Lplay end callback');};
    }
  }else{
    throw color.error('(doorSensor.js)processings is undefined!!!');
  }


  //onかoffかの判定
  lightJudge = function(){
    var dataName = '';
    lightJudge.closeCount++;
    if(lightJudge.closeCount % 2 === 1){
      dataName = '../json/lightOn.json';
    }else{
      dataName = '../json/lightOff.json';
    }
    irMagician.Lplay(dataName, processings[1]());
  };
  lightJudge.closeCount = 0;

  arduino.on('open', function(){
    console.log(color.info('arduino is opened'));

    arduino.on('data', function(data){
      console.log('<data>' + data + '</data>');
      data += '';//Object => String
      processings[0](data, lightJudge);
    });

    arduino.on('close', function(){
      console.log(color.warning('arduino is closed'));
    });
  });

};

module.exports = doorSensor;

//FIXME:ドアの開け閉めだけで判定するとめんどい
//TODO:メール送信しなくていい時の判定追加
//TODO:扉のセンサいるかいらないかの判定
