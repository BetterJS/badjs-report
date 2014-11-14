/*!
 * @module report
 * @author kael
 * @date @DATE
 * Copyright (c) 2014 kael
 * Licensed under the MIT license.
 */
(function(global) {

    var _error = global.__error__;
    var _config = {
        id: 0,
        uin: 0,
        url: "",
        level: 1,
        ignore: [],
        delay: 300
    };

    var _isOBJ = function(o, type) {
        return Object.prototype.toString.call(o) === "[object " + (type || "Object") + "]";
    };

    var _imgs = [];
    var _sendMsg = function() {
        var img = new Image();
        _imgs.push(img);
        var error_list = [];
        while(_error.length) {
            var isIgnore = false;
            var error = _error.shift();
            var error_str = JSON.stringify(error);
            for (var i = 0, l = _config.ignore; i < l; i++) {
                var rule = _config.ignore[i];
                if ((_isOBJ(rule, "RegExp") && rule.test(error_str)) ||
                    (_isOBJ(rule, "Function") && rule(error, error_str))) {
                    isIgnore = true;
                    break;
                }
            }
            !isIgnore && error_list.push(error);
        }
        var _src = _config.report + encodeURIComponent(JSON.stringify(error_list));
        img.src = _src;
    };

    var _run = function(){
        _sendMsg();
        setTimeout(_run, _config.delay);
    };

    var report = {
        pushMsg: function(msg) {
            _error.push(_isOBJ(msg) ? msg : {
                msg: msg
            });
        },
        init: function(config) {
            if (_isOBJ(config)) {
                for (var key in config) {
                    _config[key] = config[key];
                }
            }
            _config.report = _config.url + "?id={{id}}&uin={{uin}}&msg="
                .replace(/{{id}}/, parseInt(_config.id, 10))
                .replace(/{{uin}}/, parseInt(_config.uin, 10));
            _run();
        }
    };

    return report;

}(window));
