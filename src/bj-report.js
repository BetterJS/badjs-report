/*!
 * @module report
 * @author kael
 * @date @DATE
 * Copyright (c) 2014 kael,chriscai
 * Licensed under the MIT license.
 */
var BJ_REPORT = (function(global) {
    if (global.BJ_REPORT) return global.BJ_REPORT;

    var _error = [];
    var orgError = global.onerror;
    global.onerror = function(msg, url, line, col, error) {
        _error.push({
            msg: msg,
            target: url,
            rowNum: line,
            colNum: col,
            error: error
        });

        _send();
        orgError && orgError.apply(global, arguments);
    };

    var _config = {
        id: 0,
        uin: 0,
        url: "",
        combo: 1,
        level: 4, // 1-debug 2-info 4-error 8-fail
        ignore: [],
        delay: 100,
        submit: null
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
                    if (_isOBJ(value)) {
                        try {
                            value = JSON.stringify(value);
                        } catch (err) {
                            value = "<detect by report> " + err.message;
                        }
                    }
                    stringify.push(key + ":" + value);
                    param.push(key + "=" + encodeURIComponent(value));
                    params.push(key + "[" + index + "]=" + encodeURIComponent(value));
                }
            }
        }

        // msg[0]=msg&target[0]=target -- combo report
        // msg:msg,target:target -- ignore
        // msg=msg&target=target -- report with out combo
        return [params.join("&"), stringify.join(","), param.join("&")];
    };

    var _imgs = [];
    var _submit = function(url) {
        if (_config.submit) {
            _config.submit(url);
        } else {
            var _img = new Image();
            _imgs.push(_img);
            _img.src = url;
        }
    };

    var error_list = [];
    var comboTimeout = 0;
    var _send = function() {
        if (!_config.report) return;

        while (_error.length) {
            var isIgnore = false;
            var error = _error.shift();
            var error_str = _error_tostring(error, error_list.length);
            for (var i = 0, l = _config.ignore.length; i < l; i++) {
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
                    _submit(_config.report + error_str[2] + "&_t=" + (+new Date));
                }
                _config.onReport && (_config.onReport(_config.id, error));
            }
        }

        if (_config.combo && !comboTimeout) {
            comboTimeout = setTimeout(function() {
                _submit(_config.report + error_list.join("&") + "&count=" + error_list.length + "&_t=" + (+new Date));
                comboTimeout = 0;
                error_list = [];
            }, _config.delay);
        }
    };

    var report = {
        push: function(msg) { // 将错误推到缓存池
            _error.push(_isOBJ(msg) ? msg : {
                msg: msg
            });
            _send();
            return report;
        },
        report: function(msg) { // 立即上报
            msg && report.push(msg);
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
                _config.report = (_config.url || "http://badjs2.qq.com/badjs") + "?id=" + id + "&uin=" + parseInt(_config.uin || (document.cookie.match(/\buin=\D+(\d+)/) || [])[1], 10) + "&from=" + encodeURIComponent(location.href) + "&";
            }
            return report;
        }
    };

    return report;
}(window));

if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = BJ_REPORT;
    }
    exports.BJ_REPORT = BJ_REPORT;
}
