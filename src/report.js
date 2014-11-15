/*!
 * @module report
 * @author kael
 * @date @DATE
 * Copyright (c) 2014 kael
 * Licensed under the MIT license.
 */
var REPORT = (function(global) {

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
        if (!_config.report) return;
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
        img.src = _config.report + encodeURIComponent(JSON.stringify(error_list));
    };

    var _run = function(){
        _sendMsg();
        setTimeout(_run, _config.delay);
    };

    var _isInited = false;
    var report = {
        pushMsg: function(msg) { // 将错误推到缓存池
            _error.push(_isOBJ(msg) ? msg : {
                msg: msg
            });
            return report;
        },
        report: function() { // 立即上报
            _sendMsg();
            return report;
        },
        init: function(config) { // 初始化
            if (_isOBJ(config)) {
                for (var key in config) {
                    _config[key] = config[key];
                }
            }
            // 没有设置id将不上报
            var id = parseInt(_config.id, 10);
            if (id) {
                _config.report = _config.url + "?id={{id}}&uin={{uin}}&msg="
                    .replace(/{{id}}/, id)
                    .replace(/{{uin}}/, parseInt(_config.uin, 10));
                !_isInited && _run();
                _isInited = true;
            }
            return report;
        }
    };

    return report;

}(window));
