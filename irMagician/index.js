//HACK:
//FIXME:errorEmitterでthorwすると,エラーのあった行数がerrorEmitterのあるところになってしまう
//FIXME:3つのメソッドを使うと、setInterval()のコールされるタイミングの関係で,2番目と3番目が入れ替わることがある

var IRMagician = function (portName) {
  'use strict';
  var self = this;
  this.fs = require('fs');
  this.async = require('async');
  this.color = require('../src/color');
  this.fileExistCheck = require('../src/fileExistCheck');

  //this.events = require('events');
  //this.EventEmitter = require('events').EventEmitter;

  this.serial = require('serialport');
  this.SerialPort = this.serial.SerialPort;

  this.portName = portName || '/dev/ttyACM0';//MEMO:/dev/ttyACM1

  console.log(this.color.info('irMagician portName is ' + this.portName));

  this.openSerial = function () {
    console.log('opening irM...');
    try {
      this.sp = new this.SerialPort(this.portName, {
        baudrate: 9600
      });
    } catch (err) {
      throw err + self.color.error(' (cannot open irMagician)');
    }
    this.sp.on('open', function () {
      console.log(self.color.info('irMagician opened'));
    });
    this.sp.on('close', function () {
      console.log(self.color.warning('irMagician closed'));
    });
  };

  this.openSerial();

};

//position: エラーが起こった状況 (ex: 'writing p\\r\\n')
IRMagician.prototype.errorEmitter = function (err, position) {
  'use strict';
  var self = this;
  throw this.color.error('err (' + position + '):' + err);
};


IRMagician.prototype.debug = function (word, debugable) {
  'use strict';
  var self = this;
  if (debugable) {
    console.log(word);
  }
};

//NOTE:値の誤差が大きいため非推奨(自分のirMagicianだけ？)
IRMagician.prototype.temp = function () {
  'use strict';
  var self = this,
    re = /[0-1][0-9][0-9][0-9]/,
    endRe = /OK/;
  console.log(this.color.error('temp method is deprecated because the error of this value is large!!'));


  self.sp.write('t\r\n', function (err) {
    if (err) {
      self.errorEmitter(err, 'writing t\\r\\n');
    }
    self.sp.on('data', function (val) {
      var dataVal,
        degree,
        simDegree;
      self.debug(self.color.info('data received(temp) : ' + val), self.debug);
      val += '';
      dataVal = val.match(re);
      if (dataVal) { //温度の値の時
        self.debug(dataVal, self.debug);
        degree = ((5 / 1024 * dataVal) - 0.4) / (19.53 / 1000);
        simDegree = ((25 * dataVal) - 2048) / 100;
        self.debug(self.color.info('degree (c): ' + degree), self.debug);
        console.log(self.color.info('simDegree (c): ' + simDegree));
      }
      if (endRe.test(val)) { //OKのとき
        //self.sp.close();//closeした時にisFiishedがtrueになるため、消してはいけない
        console.log(self.color.info('temp end'));

      }
    });
  });
};


IRMagician.prototype.copy = function (callback) {
  'use strict';
  var self = this,
    re = /[0-640]/,
    timeoutRe = /Time Out !/,
    judgeEnd;

  callback = callback || function () {};

  judgeEnd = function () {
    self.sp.once('data', function (data) {
      console.log(self.color.info('data received(copy):' + data));
      if (re.test(data)) {
        console.log(self.color.info('copy end'));
        callback();
      } else { //終了じゃなかった時
        if (timeoutRe.test(data)) {
          console.log(self.color.info('copy end'));
        } else {
          judgeEnd();
        }
      }
    });
  };

  this.sp.write('c\r\n', function (err) {
    if (err) {
      self.errorEmitter(err, 'writing c\\r\\n');
    } else {
      judgeEnd();
    }
  });
};


IRMagician.prototype.play = function (callback) {
  'use strict';
  var self = this,
    judgeEnd = function () {
      self.sp.once('data', function (data) {
        console.log(self.color.info('data received(play):' + data));
        if (data + '' === '... Done !\r\n' || data + '' === ' Done !\r\n') { //TODO:正規表現で
          console.log(self.color.info('play end'));
          callback();
        } else { //終了じゃなかった時
          judgeEnd();
        }
      });
    };

  this.sp.write('p\r\n', function (err) {
    if (err) {
      self.errorEmitter(err, 'writing p\\r\\n');
    } else {
      judgeEnd();
    }
  });
};

//end: 処理が終わった時によばれる関数
IRMagician.prototype.Lplay = function (fileName, end) {
  var jsonData,
    recNumber,
    rawX,
    postScale,
    position = [],
    i = 0,
    self = this;

  this.end = end || function () {};

  if (fileName === undefined) {
    throw 'missing file name (fileName : ' + fileName + ')';
  }
  //TODO:ファイル存在確認

  console.log('fileName is ' + fileName);

  console.log('reading jsonData...');
  try {
    jsonData = require(fileName);
    recNumber = jsonData.data.length;
    rawX = jsonData.data;
    postScale = jsonData.postscale;
  } catch (e) {
    this.errorEmitter(e, 'reading jsonData');
  }

  for (i = 0; i < recNumber; i++) {
    position.push({
      bank: Math.floor(i / 64),
      pos: i % 64
    });
  }

  this.sp.write('n,' + recNumber + '\r\n', function (err) {
    if (err) {
      self.errorEmitter(err, 'writing n,' + recNumber + '\\r\\n');
    }

    self.sp.drain(function () {

      self.sp.write('k,' + postScale + '\r\n', function (err) {
        if (err) {
          self.errorEmitter(err, 'writing k,' + postScale + '\\r\\n');
        }
        self.sp.drain(function () {

          self.async.each(position, function (POS, callback) {
            var number = POS.bank * 64 + POS.pos;
            if (POS.pos === 0) {

              self.sp.write('b,' + POS.bank + '\r\n', function (err) {
                if (err) {
                  self.errorEmitter(err, 'writing b,' + POS.bank + '\\r\\n');
                }

                self.sp.drain(function () {
                  self.sp.write('w,' + POS.pos + ',' + rawX[number] + '\n\r', function (err) {
                    if (err) {
                      self.errorEmitter(err, 'writing w,' + POS.pos + ',' + rawX[number] + '\\r\\n');
                    }
                    self.sp.drain(function () {
                      callback(null);
                    });
                  });
                });

              });
            } else {
              self.sp.write('w,' + POS.pos + ',' + rawX[number] + '\n\r', function (err) {
                if (err) {
                  self.errorEmitter(err, 'writing w,' + POS.pos + ',' + rawX[number] + '\\r\\n');
                }
                self.sp.drain(function () {
                  callback(null);
                });
              });
            }
          }, function (err) {
            if (err) {
              self.errorEmitter(err, 'async.each all done');
            }
            console.log('each all done.');

            self.sp.write('p\r\n', function (err) {
              if (err) {
                self.errorEmitter(err, 'writing p\\r\\n');
              }
              self.sp.once('data', function (data) {
                console.log('data received(Lplay):' + data);
                if (data + '' === '... Done !\r\n' || data + '' === ' Done !\r\n') {
                  console.log('Lplay end');
                  self.end();

                } else { //終了じゃなかった時
                  self.sp.once('data', function (data2) { //もう一回lintener登録
                    console.log('data received(Lplay):' + data2);
                    if (data2 + '' === '... Done !\r\n' || data2 + '' === ' Done !\r\n') {
                      console.log('Lplay end');
                      self.end();

                    } //NOTE:最大でも2回しか呼ばれない?からここでのelse{}は無くていい?
                  });
                }
              });
            });
          });
        });
      });
    });
  });
};


/*
overwritable : fileNameと同じ名前のファイルが存在していた場合,上書きするかどうか default = false
debug : console.logで詳細な情報を出力するか default = false
*/
IRMagician.prototype.save = function (fileName, overwritable, debug) {
  'use strict';
  var array = [],
    rawX = [],
    self = this;

  this.overwritable = (overwritable === undefined) ? false : overwritable;
  this.debug = (debug === undefined) ? false : debug;

  if (!fileName) {
    throw 'missing file name';
  }
  //CHANGE:ファイル存在確認(上書きするかどうか)変更したので要確認
  this.fileExistCheck(fileName, function (filePath) {
    if (filePath && overwritable === false) {
      throw this.color.error(filePath + ' exist (overwritable is false)');
    }
  });

  this.sp.write('i,1\r\n', function (err) {
    if (err) {
      self.errorEmitter(err, 'writing i,1\\r\\n');
    }
    self.sp.drain(function () {
      self.sp.once('data', function (recNumber) {
        recNumber = parseInt(recNumber, 16);
        console.log('data received(save) recNumber:' + recNumber);

        self.sp.write('i,6\r\n', function (err) {
          if (err) {
            self.errorEmitter(err, 'writing i,6\\r\\n');
          }
          self.sp.once('data', function (postScale) {
            var i = 0;
            postScale = postScale / 1;
            console.log('data received(save) postScale:' + recNumber);
            for (i = 0; i < recNumber; i++) {
              array.push({
                bank: Math.floor(i / 64),
                pos: i % 64,
                judge: true
              });
            }
            self.async.each(array, function (POS, eachCallback) {
              var index,
                dataCount = 0,
                dataArray = [],
                xdata;
              if (POS.pos === 0) {

                self.sp.write('b,' + POS.bank + '\r\n', function () {
                  if (err) {
                    self.errorEmitter(err, 'writing b,' + POS.bank + '\\n\\r');
                  }
                  self.sp.drain(function () {
                    self.sp.write('d,' + POS.pos + '\n\r', function (err) {
                      if (err) {
                        self.errorEmitter(err, 'writing d,' + POS.pos + '\\n\\r');
                      }
                      self.sp.once('data', function (data) {

                        index = POS.bank * 64 + POS.pos;
                        self.debug('data received(save) d,' + POS.pos + ':' + data, debug);
                        if (data.length > 3) { //例 : '0a 27 27'
                          if (dataCount === 0) {
                            data += ''; //dataをStringに
                            dataArray = data.split(' ');
                          }
                          xdata = parseInt(dataArray[dataCount], 16);
                          rawX[index] = xdata;
                          dataCount += 1;
                          if (dataCount >= dataArray.length - 1) { //dataCount初期化
                            dataCount = 0;
                          }
                        } else {
                          xdata = parseInt(data, 16);
                          rawX[index] = xdata;
                        }
                        self.debug('rawX[' + index + '] : ' + rawX[index] + '\n', debug);
                        POS.judge = false;

                        eachCallback();

                      });
                    });
                  });
                });

              } else {
                self.sp.write('d,' + POS.pos + '\n\r', function (err) {
                  if (err) {
                    self.errorEmitter(err, 'writing d,' + POS.pos + '\\n\\r');
                  }
                  self.sp.once('data', function (data) {

                    index = POS.bank * 64 + POS.pos;
                    self.debug('data received(save) d,' + POS.pos + ':' + data, debug);
                    if (data.length > 3) { //例 : '0a 27 27'
                      if (dataCount === 0) {
                        data += ''; //dataをStringに
                        dataArray = data.split(' ');
                      }
                      xdata = parseInt(dataArray[dataCount], 16);
                      rawX[index] = xdata;
                      dataCount += 1;
                      if (dataCount >= dataArray.length - 1) { //dataCount初期化
                        dataCount = 0;
                      }
                    } else {
                      xdata = parseInt(data, 16);
                      rawX[index] = xdata;
                    }
                    self.debug('rawX[' + index + '] : ' + rawX[index] + '\n', debug);
                    POS.judge = false;

                    eachCallback(null, rawX);

                  });
                });
              }

            }, function (err) {
              var jsonData = {};
              if (err) {
                self.errorEmitter(err, 'async.each all done');
              }

              jsonData = {
                postscale: postScale,
                freq: 38,
                data: rawX,
                format: 'raw'
              };
              //FUTURE:ファイル上書きするしない
              self.fs.writeFileSync(fileName, JSON.stringify(jsonData));
              //fs.writeFileSync(fileName, JSON.stringify(jsonData, null, '    '));//NOTE:こっちの方が見やすい?
              self.sp.close();//closeした時にisFiishedがtrueになるため、消してはいけない
              console.log('save end');

            });
          });
        });
      });
    });
  });
};

module.exports = IRMagician;

//var irMagician = new IRMagician('/dev/ttyACM0');
//irMagician.copy();
//irMagician.save('test.json');
//irMagician.play();
//irMagician.Lplay('./test.json');
//irMagician.temp();
