/*
2つの信号を可視化(グラフ化)して、さらに差分をグラフ化する

argv1:json
argv2:json
argv3:型[string or array](optional)

それぞれのグラフ:
  on :'='
  off:'-'

差分:
  on :'+'
  off:'-'
*/

var filePath,
    filePath2,
    jsonData,
    jsonData2,
    data,
    data2,
    value = [],
    value2 = [],
    diff,
    toValue,
    largerLength,
    type;

filePath = process.argv[2];
filePath2 = process.argv[3];
type = process.argv[4];

if(!filePath){
  throw 'filePath is empty';
}
else{
  jsonData = require(filePath);
}

if(!filePath2){
  throw 'filePath2 is empty';
}
else{
  jsonData2 = require(filePath2);
}

if(!type){
  type = 'string';
}else{
  type = type;
}

if(type ==='string'){
  diff = '';
}else{
  if(type === 'array'){
    diff = [];
  }
}


data = jsonData.data;
data2 = jsonData2.data;


toValue = function(data,value){
  for(var i = 0;i < data.length;i++){
    value[i] = '';
    for(var j = 0;j < data[i];j++){
      if(i%2 == 0){
        value[i] += '=';
      }else{
        value[i] += '-';
      }
    }
  }
};
toValue(data,value);
toValue(data2,value2);

console.log('value1:')
console.log(value);
console.log('\n\n\n\n\n');
console.log('value2:');
console.log(value2);

largerLength = ((value.length - value2.length) > 0) ? value.length : value2.length;

for(var k=0;k<largerLength;k++){
  var diffCount;
  if(value[k] !== undefined && value2[k] !== undefined){
    diffCount = value[k].length - value2[k].length;
  }else{
    console.log('error!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    if(value[k] == undefined && value2[k] !== undefined){
      diffCount = -1*value2[k].length;
    }
    if(value[k] !== undefined && value2[k] == undefined){
      diffCount = value[k].length;
    }
  }
  if(type === 'array'){
    diff[k] = '';
    for(var l=0;l<Math.abs(diffCount);l++){
      if(diffCount > 0){
        diff[k] += '+';
      }else{
        if(diffCount < 0){
          diff[k] += '-';
        }
      }
    }
  }else{
    if(diffCount === 0){
      diff += ':';
    }
    if(type === 'string'){
      for(var l=0;l<Math.abs(diffCount);l++){
        if(diffCount > 0){
          diff += '+';
        }else{
          if(diffCount < 0){
            diff += '-';
          }
        }
      }
      diff += '\n';
    }else{
      throw 'typeが不適切';
    }
  }

}
console.log('\n\n\n\n\ndiff:');
console.log(diff);
