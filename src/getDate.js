var GetDate = function () {
  'use strict';

  this.dateFormat = function (num) {
    if(num < 10){
      return '0'+num;
    }else{
      return num;
    }
  };
};

GetDate.prototype = {

  getTime: function () {
    'use strict';
    var now = new Date();

    var year = this.dateFormat(now.getFullYear());

    var month = this.dateFormat(now.getMonth()+1);

    var day = function(){
      var weekDayJP = ["日","月","火","水","木","金","土"];
      return weekDayJP[now.getDay()];
    };

    var date = this.dateFormat(now.getDate());

    var hours = this.dateFormat(now.getHours());

    var minutes = this.dateFormat(now.getMinutes());

    var seconds = this.dateFormat(now.getSeconds());

    var milliseconds = this.dateFormat(now.getMilliseconds());

    return year + ' ' + month + '/' + date + ' ' + hours + ':' + minutes + ':' + seconds;
  }

};

module.exports = GetDate;
