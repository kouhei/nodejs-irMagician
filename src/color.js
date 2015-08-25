var color = {
    brown   : '\033[30m',
    gray    : '\033[90m',
    red     : '\033[31m',
    green   : '\033[32m',
    yellow  : '\033[33m',
    blue    : '\033[34m',
    pink    : '\033[35m',
    skyblue : '\033[36m',
    white   : '\033[37m',
    reset   : '\033[0m' ,

    info    : function (word) {return this.blue   + word + this.reset;},//TODO:青と水色を切り替えられるように
    error   : function (word) {return this.red    + word + this.reset;},
    warning : function (word) {return this.yellow + word + this.reset;},
    safe    : function (word) {return this.green  + word + this.reset;},
}

module.exports = color;
