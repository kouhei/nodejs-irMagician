/*
filePathの存在を確認する
存在する:
  ディレクトリである: エラーをなげる
  ファイルである: コールバックの引数としてfilePathを返す

存在しない: コールバックの引数としてfalseを返す

filePath: ファイルの(requireしたところでの)パス
callback: オプショナル(引数にfilePathかfalse)
*/

function fileExistCheck(filePath, callback){
  'use strict';
  var fs = require('fs'),
    color = require('./color');

  if (!callback) {
    callback = function(){};
  }
  if(!filePath){
    throw color.error('filePath is required');
  }

  fs.stat(filePath, function (err, stat) {
    if (err) {
      switch (err.code) {
        case 'ENOENT':
          callback(false);
          break;

        default:
          throw color.error('unexpected error: ' + err.code);
      }
    } else {
      if (fs.statSync( filePath ).isFile()) {
        //console.log('"' + filePath + '" is a file.');
        callback(filePath);
      }else{
        if (fs.statSync( filePath ).isDirectory()) {
          throw filePath + ' is a directory.';
        }
      }
    }
  });
}

module.exports = fileExistCheck;

/*
example:
  fileExistCheck(filePath, function(file){
    consle.log('file');
  });
*/

//OPTION:パスを絶対パスで返す
