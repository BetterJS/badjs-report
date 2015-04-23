/*!
 * @module report
 * @author kael
 * @date @DATE
 * Copyright (c) 2014 kael
 * Licensed under the MIT license.
 */
var BJ_REPORT = (function(global) {
    if (global.REPORT) return global.REPORT;

    var _error = [];
    global.onerror = function(msg, url, line, col, error) {
        _error.push({
            msg: msg,
            target: url,
            rowNum : line,
            colNum : col,
            error: error
        });

        _run();

    };

    var _config = {
        id: 0,
        uin: 0,
        url: "",
        combo: 1,
        level: 4, // 1-debug 2-info 4-error 8-fail
        ignore: [],
        delay: 100
    };

    var _isOBJ = function(o, type) {
        return Object.prototype.toString.call(o) === "[object " + (type || "Object") + "]";
    };

    var _error_tostring = function(error, index) {
        var param = [];
        var params = [];
        var stringify = [];
        if (_isOBJ(error)) {
            error.level = error.level || _config.level;
            for (var key in error) {
                var value = error[key] || "";
                if (value) {
                    if(typeof value =='object'){
                        value = JSON.stringify(value);
                    }
                    stringify.push(key + ":" + value);
                    param.push(key + "=" + encodeURIComponent(value));
                    params.push(key + "[" + index + "]=" + encodeURIComponent(value));
                }
            }
        }
        return [params.join("&"), stringify.join(","), param.join("&")];
    };

    var _imgs = [];
    var _send = function() {
        if (!_config.report) return;
        var error_list = [];
        var img = null;
        while (_error.length) {
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
            if (!isIgnore) {
                if (_config.combo) {
                    error_list.push(error_str[0]);
                } else {
                    img = new Image();
                    _imgs.push(img);
                    img.src = _config.report + error_str[2] + "&_t=" + (+new Date);
                }
            }
        }
        var count = error_list.length;
        if (_config.combo && count) {
            img = new Image();
            _imgs.push(img);
            img.src = _config.report + error_list.join("&") + "&count" + count + "&_t=" + (+new Date);
        }
    };

    var _run = function() {
        setTimeout(function() {
            _send();
//            _run();
        }, _config.delay);
    };

    var _isInited = false;
    var report = global.REPORT = {
        push: function(msg) { // 将错误推到缓存池
            _error.push(_isOBJ(msg) ? msg : {
                msg: msg
            });
            return report;
        },
        report: function(msg) { // 立即上报
            msg && report.push(msg);
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
                _config.report = (_config.url || "http://badjs2.qq.com/badjs")
                    + "?id=" + id
                    + "&uin=" + parseInt(_config.uin || (document.cookie.match(/uin=\D+(\d+)/) || [])[1], 10)
                    + "&from=" + encodeURIComponent(location.href)
                    + "&";
                //!_isInited && _run();
                _isInited = true;
            }
            return report;
        }
    };

    return report;

}(window));
