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

    var _error_tostring = function(error, index) {
        var params = [];
        var stringify = [];
        if (_isOBJ(error)) {
            for (var key in error) {
                var value = error[key] || "";
                if (value) {
                    stringify.push(key + ":" + value);
                    params.push(key + "[{{index}}]=" + encodeURIComponent(value));
                }
            }
        }
        return [params.join("&").replace(/{{index}}/g, parseInt(index, 10) || 0), stringify.join(",")];
    };

    var _imgs = [];
    var _send = function() {
        if (!_config.report) return;
        var img = new Image();
        _imgs.push(img);
        var error_list = [];
        while(_error.length) {
            var isIgnore = false;
            var error = _error.shift();
            var error_str = _error_tostring(error, error_list.length); // JSON.stringify(error);
            for (var i = 0, l = _config.ignore; i < l; i++) {
                var rule = _config.ignore[i];
                if ((_isOBJ(rule, "RegExp") && rule.test(error_str[1])) ||
                    (_isOBJ(rule, "Function") && rule(error, error_str[1]))) {
                    isIgnore = true;
                    break;
                }
            }
            !isIgnore && error_list.push(error_str[0]); // error_list.push(error);
        }
        error_list.length  && (img.src = _config.report + error_list.join("&")); // encodeURIComponent(JSON.stringify(error_list));
    };

    var _run = function(){
        _send();
        setTimeout(_run, _config.delay);
    };

    var _isInited = false;
    var report = {
        push: function(msg) { // 将错误推到缓存池
            _error.push(_isOBJ(msg) ? msg : {
                msg: msg
            });
            return report;
        },
        report: function() { // 立即上报
            _send();
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
                _config.report = (_config.url + "?id={{id}}&uin={{uin}}&from=" + encodeURIComponent(location.href) + "&")
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
