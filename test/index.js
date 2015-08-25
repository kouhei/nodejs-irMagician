var IRMagician = function (portName) {
    'use strict';
    var fs = require('fs'),
        async = require('async'),
        color = require('../src/color'),
        serial = require('serialport'),
        SerialPort = serial.SerialPort,
        sp,

        isOpened = false, //ポート開いているかどうか
        isFinished = false, //使っているかどうか
        isOpening = false, //ポート開けようとしているかどうか(最初はisOpenedがfalseなので,非同期の都合上falseに)

        copyTimer,
        playTimer,
        LplayTimer,
        saveTimer,
        cmdTimer,
        tempTimer,

        self = this;

    portName = portName || '/dev/ttyACM0';
    console.log(color.info('portName is ' + portName));


    self.errorEmitter = function (err, position) { //MEMO:position => エラーが起こった状況 ex) 'writing p\\r\\n'
        throw color.error('err (' + position + '):' + err);
    };

    self.openSerial = function () {
        isOpening = true;
        sp = new SerialPort(portName, {
            baudrate: 9600
        });
        sp.on('open', function () {
            console.log(color.info('serial opened'));
            isOpened = true;
            isFinished = true;
            isOpening = false;
        });
        sp.on('close', function () {
            console.log(color.warning('serial closed'));
            isOpened = false;
            isFinished = false;
        });
    };


    /*self.cmd = function (command) {
        if (!isOpened) { self.openSerial(); }
        if (isFinished) {
            isFinished = false;
            clearImmediate(cmdTimer);
            //clearInterval(cmdTimer);

            sp.write(command, function(err){
                if (err) {self.errorEmitter(err, 'writing ' + command)}

            });

            isFinished = true;
        } else {
            clearImmediate(cmdTimer);
            cmdTimer = setImmediate(self.cmd, command)
            //clearInterval(cmdTimer);
            //cmdTimer = setInterval(function(){self.cmd(command);},100);
        }

    };*/


    self.temp = function () {
        if (!isOpening && !isOpened) {
            self.openSerial();
        }
        if (isFinished) {
            var re = /[0-1][0-9][0-9][0-9]/,
                endRe = /OK/;
            isFinished = false;
            //clearImmediate(tempTimer);
            clearInterval(tempTimer);

            sp.write('t\r\n', function (err) {
                if (err) {
                    self.errorEmitter(err, 'writing t\\r\\n');
                }
                sp.on('data', function (val) {
                    var dataVal,
                        degree,
                        simDegree;
                    console.log(color.info('data received(temp) : ' + val));
                    val += '';
                    dataVal = val.match(re);
                    if (dataVal) { //温度の値の時
                        console.log(dataVal);
                        degree = ((5 / 1024 * dataVal) - 0.4) / (19.53 / 1000);
                        simDegree = ((25 * dataVal) - 2048) / 100;
                        console.log(color.info('degree (c): ' + degree));
                        console.log(color.info('simDegree (c): ' + simDegree));
                    }
                    if (endRe.test(val)) { //OKのとき
                        sp.close();
                        console.log(color.info('temp end'));
                        isFinished = true;
                    }
                });
            });

            isFinished = true;
        } else {
            //clearImmediate(tempTimer);
            //tempTimer = setImmediate(self.temp);
            clearInterval(tempTimer);
            tempTimer = setInterval(function () {
                self.temp();
            }, 100);
        }
    };


    self.copy = function () { //TODO:'Time Out !'のときの処理
        if (!isOpening && !isOpened) {
            self.openSerial();
        }

        if (isFinished) {
            var re = /[0-640]/,
                timeoutRe = /Time Out !/;
            isFinished = false;
            //clearImmediate(copyTimer);
            clearInterval(copyTimer);

            sp.write('c\r\n', function (err) {
                if (err) {
                    self.errorEmitter(err, 'writing c\\r\\n');
                }

                sp.once('data', function (data) {
                    console.log(color.info('data received(copy):' + data));
                    if (re.test(data)) {
                        sp.close();
                        console.log(color.info('copy end'));
                        isFinished = true;
                    } else { //終了じゃなかった時
                        if (timeoutRe.test(data)) {
                            sp.close();
                            console.log(color.info('copy end'));
                            isFinished = true;
                        } else {
                            sp.once('data', function (data2) { //もう一回lintener登録
                                console.log(color.info('data received(copy):' + data2));
                                if (re.test(data2)) {
                                    sp.close();
                                    console.log(color.info('copy end'));
                                    isFinished = true;
                                } else {
                                    if (timeoutRe.test(data2)) {
                                        sp.close();
                                        console.log(color.info('copy end'));
                                        isFinished = true;
                                    }
                                } //NOTE:最大でも2回しか呼ばれない?からここでのelse{}は無くていい?
                            });
                        }
                    }
                });
            });

        } else {
            //clearImmediate(copyTimer);
            //copyTimer = setImmediate(self.copy);
            clearInterval(copyTimer);
            copyTimer = setInterval(function () {
                self.copy();
            }, 100);
        }

    };


    self.play = function () {
        if (!isOpening && !isOpened) {
            self.openSerial();
        }

        if (isFinished) {
            isFinished = false;
            //clearImmediate(playTimer);
            clearInterval(playTimer);

            sp.write('p\r\n', function (err) {
                if (err) {
                    self.errorEmitter(err, 'writing p\\r\\n');
                }

                sp.once('data', function (data) {
                    console.log(color.info('data received(play):' + data));
                    if (data + '' === '... Done !\r\n' || data + '' === ' Done !\r\n') { //TODO:正規表現で
                        sp.close();
                        console.log(color.info('play end'));
                    } else { //終了じゃなかった時
                        sp.once('data', function (data2) { //もう一回lintener登録
                            console.log(color.info('data received(play):' + data2));
                            if (data2 + '' === '... Done !\r\n' || data2 + '' === ' Done !\r\n') {
                                sp.close();
                                console.log('play end');
                                isFinished = true;
                            } //NOTE:最大でも2回しか呼ばれない?からここでのelse{}は無くていい?
                        });
                    }
                });
            });
        } else {
            //clearImmediate(playTimer);
            //playTimer = setImmediate(self.play);
            clearInterval(playTimer);
            playTimer = setInterval(function () {
                self.play();
            }, 100);
        }
    };


    self.Lplay = function (fileName) {
        var jsonData,
            recNumber,
            rawX,
            postScale,
            position = [],
            i = 0;

        if (!isOpening && !isOpened) {
            self.openSerial();
        }
        if (fileName === undefined) {
            throw 'missing file name (fileName : ' + fileName + ')';
        }

        //TODO:ファイル存在確認
        if (isFinished) {
            isFinished = false;
            //clearImmediate(LplayTimer);
            clearInterval(LplayTimer);

            console.log('fileName is ' + fileName);

            console.log('reading jsonData...');
            try {
                jsonData = require(fileName);
                recNumber = jsonData.data.length;
                rawX = jsonData.data;
                postScale = jsonData.postscale;
            } catch (e) {
                self.errorEmitter(e, 'reading jsonData');
            }

            for (i = 0; i < recNumber; i++) {
                position.push({
                    bank: Math.floor(i / 64),
                    pos: i % 64
                });
            }

            sp.write('n,' + recNumber + '\r\n', function (err) {
                if (err) {
                    self.errorEmitter(err, 'writing n,' + recNumber + '\\r\\n');
                }

                sp.drain(function () {

                    sp.write('k,' + postScale + '\r\n', function (err) {
                        if (err) {
                            self.errorEmitter(err, 'writing k,' + postScale + '\\r\\n');
                        }
                        sp.drain(function () {

                            async.each(position, function (POS, callback) {
                                var number = POS.bank * 64 + POS.pos;
                                if (POS.pos === 0) {

                                    sp.write('b,' + POS.bank + '\r\n', function (err) {
                                        if (err) {
                                            self.errorEmitter(err, 'writing b,' + POS.bank + '\\r\\n');
                                        }

                                        sp.drain(function () {
                                            sp.write('w,' + POS.pos + ',' + rawX[number] + '\n\r', function (err) {
                                                if (err) {
                                                    self.errorEmitter(err, 'writing w,' + POS.pos + ',' + rawX[number] + '\\r\\n');
                                                }
                                                sp.drain(function () {
                                                    callback(null);
                                                });
                                            });
                                        });

                                    });
                                } else {
                                    sp.write('w,' + POS.pos + ',' + rawX[number] + '\n\r', function (err) {
                                        if (err) {
                                            self.errorEmitter(err, 'writing w,' + POS.pos + ',' + rawX[number] + '\\r\\n');
                                        }
                                        sp.drain(function () {
                                            callback(null);
                                        });
                                    });
                                }
                            }, function (err) {
                                if (err) {
                                    self.errorEmitter(err, 'async.each all done');
                                }
                                console.log('each all done.');

                                sp.write('p\r\n', function (err) {
                                    if (err) {
                                        self.errorEmitter(err, 'writing p\\r\\n');
                                    }
                                    sp.once('data', function (data) {
                                        console.log('data received(Lplay):' + data);
                                        if (data + '' === '... Done !\r\n' || data + '' === ' Done !\r\n') {
                                            sp.close();
                                            console.log('Lplay end');
                                        } else { //終了じゃなかった時
                                            sp.once('data', function (data2) { //もう一回lintener登録
                                                console.log('data received(Lplay):' + data2);
                                                if (data2 + '' === '... Done !\r\n' || data2 + '' === ' Done !\r\n') {
                                                    sp.close();
                                                    console.log('Lplay end');
                                                    isFinished = true;
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
        } else {
            //clearImmediate(LplayTimer);
            //LplayTimer = setImmediate(self.Lplay, fileName);
            clearInterval(LplayTimer);
            LplayTimer = setInterval(function () {
                self.Lplay(fileName);
            }, 100);
        }
    };


    self.save = function (fileName, overwritable) { //MEMO:overwritable : fileNameと同じ名前のファイルが存在していた場合,上書きするかどうか default = false
        var array = [],
            rawX = [];
        overwritable = (overwritable === undefined) ? false : overwritable;
        if (!isOpening && !isOpened) {
            self.openSerial();
        }
        if (!fileName) {
            throw 'missing file name';
        }
        //TODO:ファイル存在確認(上書きするかどうか)
        if (isFinished) {
            isFinished = false;
            //clearImmediate(saveTimer);
            clearInterval(saveTimer);

            sp.write('i,1\r\n', function (err) {
                if (err) {
                    self.errorEmitter(err, 'writing i,1\\r\\n');
                }
                sp.drain(function () {
                    sp.once('data', function (recNumber) {
                        recNumber = parseInt(recNumber, 16);
                        console.log('data received(save) recNumber:' + recNumber);

                        sp.write('i,6\r\n', function (err) {
                            if (err) {
                                self.errorEmitter(err, 'writing i,6\\r\\n');
                            }
                            sp.once('data', function (postScale) {
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
                                async.each(array, function (POS, eachCallback) {
                                    var index,
                                        dataCount = 0,
                                        dataArray = [],
                                        xdata;
                                    if (POS.pos === 0) {

                                        sp.write('b,' + POS.bank + '\r\n', function () {
                                            sp.drain(function () {
                                                sp.write('d,' + POS.pos + '\n\r', function (err) {
                                                    if (err) {
                                                        self.errorEmitter(err, 'writing d,' + POS.pos + '\\n\\r');
                                                    }
                                                    sp.once('data', function (data) {

                                                        index = POS.bank * 64 + POS.pos;
                                                        console.log('data received(save) d,' + POS.pos + ':' + data);
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
                                                        console.log('rawX[' + index + '] : ' + rawX[index] + '\n');
                                                        POS.judge = false;

                                                        eachCallback();

                                                    });
                                                });
                                            });
                                        });

                                    } else {
                                        sp.write('d,' + POS.pos + '\n\r', function (err) {
                                            if (err) {
                                                self.errorEmitter(err, 'writing d,' + POS.pos + '\\n\\r');
                                            }
                                            sp.once('data', function (data) {

                                                index = POS.bank * 64 + POS.pos;
                                                console.log('data received(save) d,' + POS.pos + ':' + data);
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
                                                console.log('rawX[' + index + '] : ' + rawX[index] + '\n');
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
                                    fs.writeFileSync(fileName, JSON.stringify(jsonData));
                                    //fs.writeFileSync(fileName, JSON.stringify(jsonData, null, '    '));//NOTE:こっちの方が見やすい?
                                    sp.close();
                                    console.log('save end');
                                    isFinished = true;
                                });
                            });
                        });
                    });
                });
            });
        } else {
            //clearImmediate(saveTimer);
            //saveTimer = setImmediate(self.save, fileName);
            clearInterval(saveTimer);
            saveTimer = setInterval(function () {
                self.save(fileName, overwritable);
            }, 100);
        }

    };
};

var irMagician = new IRMagician('/dev/ttyACM0');
irMagician.copy();
irMagician.save('test2.json');
irMagician.play();
irMagician.Lplay('./test2.json');
//irMagician.temp();

//FUTURE:sp.write()でのerrがあった時のエラーハンドリングしてるか確認
//FIXME:errorEmitterでthorwすると,エラーのあった行数がerrorEmitterのあるところになってしまう
//FIXME:3つのメソッドを使うと、setInterval()のコールされるタイミングの関係で,2番目と3番目が入れ替わることがある
