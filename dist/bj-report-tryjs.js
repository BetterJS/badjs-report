/*!
 * @module report
 * @author kael, chriscai
 * @date @DATE
 * Copyright (c) 2014 kael, chriscai
 * Licensed under the MIT license.
 */
var BJ_REPORT = (function(global) {
    if (global.BJ_REPORT) return global.BJ_REPORT;

    var _error = [];
    var _config = {
        id: 0,
        uin: 0,
        url: "",
        combo: 1,
        ext: null,
        level: 4, // 1-debug 2-info 4-error
        ignore: [],
        random: 1,
        delay: 1000,
        submit: null
    };

    var _isOBJByType = function(o, type) {
        return Object.prototype.toString.call(o) === "[object " + (type || "Object") + "]";
    };

    var _isOBJ = function(obj) {
        var type = typeof obj;
        return type === "object" && !!obj;
    };

    var _isEmpty = function(obj) {
        if (obj === null) return true;
        if (_isOBJByType(obj, 'Number')) {
            return false;
        }
        return !obj;
    };

    var orgError = global.onerror;
    // rewrite window.oerror
    global.onerror = function(msg, url, line, col, error) {
        var newMsg = msg;

        if (error && error.stack) {
            newMsg = _processStackMsg(error);
        }

        if (_isOBJByType(newMsg, "Event")) {
            newMsg += newMsg.type ? ("--" + newMsg.type + "--" + (newMsg.target ? (newMsg.target.tagName + "::" + newMsg.target.src) : "")) : "";
        }

        report.push({
            msg: newMsg,
            target: url,
            rowNum: line,
            colNum: col
        });

        _send();
        orgError && orgError.apply(global, arguments);
    };

    var _processError = function(errObj) {
        try {
            if (errObj.stack) {
                var url = errObj.stack.match("https?://[^\n]+");
                url = url ? url[0] : "";
                var rowCols = url.match(":(\\d+):(\\d+)");
                if (!rowCols) {
                    rowCols = [0, 0, 0];
                }

                var stack = _processStackMsg(errObj);
                return {
                    msg: stack,
                    rowNum: rowCols[1],
                    colNum: rowCols[2],
                    target: url.replace(rowCols[0], "")
                };
            } else {
                //ie 独有 error 对象信息，try-catch 捕获到错误信息传过来，造成没有msg
                if (errObj.name && errObj.message && errObj.description) {
                    return {
                        msg: JSON.stringify(errObj)
                    };
                }
                return errObj;
            }
        } catch (err) {
            return errObj;
        }
    };

    var _processStackMsg = function(error) {
        var stack = error.stack.replace(/\n/gi, "").split(/\bat\b/).slice(0, 9).join("@").replace(/\?[^:]+/gi, "");
        var msg = error.toString();
        if (stack.indexOf(msg) < 0) {
            stack = msg + "@" + stack;
        }
        return stack;
    };

    var _error_tostring = function(error, index) {
        var param = [];
        var params = [];
        var stringify = [];
        if (_isOBJ(error)) {
            error.level = error.level || _config.level;
            for (var key in error) {
                var value = error[key];
                if (!_isEmpty(value)) {
                    if (_isOBJ(value)) {
                        try {
                            value = JSON.stringify(value);
                        } catch (err) {
                            value = "[BJ_REPORT detect value stringify error] " + err.toString();
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
    var _send = function(isReoprtNow) {
        if (!_config.report) return;

        while (_error.length) {
            var isIgnore = false;
            var error = _error.shift();
            var error_str = _error_tostring(error, error_list.length);
            if (_isOBJByType(_config.ignore, "Array")) {
                for (var i = 0, l = _config.ignore.length; i < l; i++) {
                    var rule = _config.ignore[i];
                    if ((_isOBJByType(rule, "RegExp") && rule.test(error_str[1])) ||
                        (_isOBJByType(rule, "Function") && rule(error, error_str[1]))) {
                        isIgnore = true;
                        break;
                    }
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

        // 合并上报
        var count = error_list.length;
        if (count) {
            var comboReport = function() {
                clearTimeout(comboTimeout);
                _submit(_config.report + error_list.join("&") + "&count=" + error_list.length + "&_t=" + (+new Date));
                comboTimeout = 0;
                error_list = [];
            };

            if (isReoprtNow) {
                comboReport(); // 立即上报
            } else if (!comboTimeout) {
                comboTimeout = setTimeout(comboReport, _config.delay); // 延迟上报
            }
        }
    };

    var report = {
        push: function(msg) { // 将错误推到缓存池
            // 抽样
            if (Math.random() >= _config.random) {
                return report;
            }

            var data = _isOBJ(msg) ? _processError(msg) : {
                msg: msg
            };
            // ext 有默认值, 且上报不包含 ext, 使用默认 ext
            if (_config.ext && !data.ext) {
                data.ext = _config.ext;
            }
            _error.push(data);
            _send();
            return report;
        },
        report: function(msg) { // error report
            msg && report.push(msg);
            _send(true);
            return report;
        },
        info: function(msg) { // info report
            if (!msg) {
                return report;
            }
            if (_isOBJ(msg)) {
                msg.level = 2;
            } else {
                msg = {
                    msg: msg,
                    level: 2
                };
            }
            report.push(msg);
            return report;
        },
        debug: function(msg) { // debug report
            if (!msg) {
                return report;
            }
            if (_isOBJ(msg)) {
                msg.level = 1;
            } else {
                msg = {
                    msg: msg,
                    level: 1
                };
            }
            report.push(msg);
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
                // set default report url and uin
                if (/qq\.com$/gi.test(location.hostname)) {
                    if (!_config.url) {
                        _config.url = "//badjs2.qq.com/badjs";
                    }

                    if (!_config.uin) {
                        _config.uin = parseInt((document.cookie.match(/\buin=\D+(\d+)/) || [])[1], 10);
                    }
                }

                _config.report = (_config.url || "/badjs") +
                    "?id=" + id +
                    "&uin=" + _config.uin +
                    "&from=" + encodeURIComponent(location.href) +
                    "&";
            }

            // if had error in cache , report now
            if(_error.length){
                _send();
            }
            return report;
        },

        __onerror__: global.onerror
    };

    typeof console !== "undefined" && console.error && setTimeout(function() {
        var err = ((location.hash || '').match(/([#&])BJ_ERROR=([^&$]+)/) || [])[2];
        err && console.error("BJ_ERROR", decodeURIComponent(err).replace(/(:\d+:\d+)\s*/g, '$1\n'));
    }, 0);

    return report;

}(window));

if (typeof exports !== "undefined") {
    if (typeof module !== "undefined" && module.exports) {
        exports = module.exports = BJ_REPORT;
    }
    exports.BJ_REPORT = BJ_REPORT;
}
;(function(root) {

    if (!root.BJ_REPORT) {
        return;
    }

    var _onthrow = function(errObj) {
        root.BJ_REPORT.report(errObj);
    };

    var tryJs = root.BJ_REPORT.tryJs = function init(throwCb) {
        throwCb && (_onthrow = throwCb);
        return tryJs;
    };

    // merge
    var _merge = function(org, obj) {
        var key;
        for (key in obj) {
            org[key] = obj[key];
        }
    };

    // function or not
    var _isFunction = function(foo) {
        return typeof foo === 'function';
    };

    var timeoutkey;

    var cat = function(foo, args) {
        return function() {
            try {
                return foo.apply(this, args || arguments);
            } catch (error) {

                _onthrow(error);

                //some browser throw error (chrome) , can not find error where it throw,  so print it on console;
                if (error.stack && console && console.error) {
                    console.error("[BJ-REPORT]", error.stack);
                }

                // hang up browser and throw , but it should trigger onerror , so rewrite onerror then recover it
                if (!timeoutkey) {
                    var orgOnerror = root.onerror;
                    root.onerror = function() {};
                    timeoutkey = setTimeout(function() {
                        root.onerror = orgOnerror;
                        timeoutkey = null;
                    }, 50);
                }
                throw error;
            }
        };
    };

    var catArgs = function(foo) {
        return function() {
            var arg, args = [];
            for (var i = 0, l = arguments.length; i < l; i++) {
                arg = arguments[i];
                _isFunction(arg) && (arg = cat(arg));
                args.push(arg);
            }
            return foo.apply(this, args);
        };
    };

    var catTimeout = function(foo) {
        return function(cb, timeout) {
            // for setTimeout(string, delay)
            if (typeof cb === 'string') {
                try {
                    cb = new Function(cb);
                } catch (err) {
                    throw err;
                }
            }
            var args = [].slice.call(arguments, 2);
            // for setTimeout(function, delay, param1, ...)
            cb = cat(cb, args.length && args);
            return foo(cb, timeout);
        };
    };

    /**
     * makeArgsTry
     * wrap a function's arguments with try & catch
     * @param {Function} foo
     * @param {Object} self
     * @returns {Function}
     */
    var makeArgsTry = function(foo, self) {
        return function() {
            var arg, tmp, args = [];
            for (var i = 0, l = arguments.length; i < l; i++) {
                arg = arguments[i];
                _isFunction(arg) && (tmp = cat(arg)) &&
                    (arg.tryWrap = tmp) && (arg = tmp);
                args.push(arg);
            }
            return foo.apply(self || this, args);
        };
    };

    /**
     * makeObjTry
     * wrap a object's all value with try & catch
     * @param {Function} foo
     * @param {Object} self
     * @returns {Function}
     */
    var makeObjTry = function(obj) {
        var key, value;
        for (key in obj) {
            value = obj[key];
            if (_isFunction(value)) obj[key] = cat(value);
        }
        return obj;
    };

    /**
     * wrap jquery async function ,exp : event.add , event.remove , ajax
     * @returns {Function}
     */
    tryJs.spyJquery = function() {
        var _$ = root.$;

        if (!_$ || !_$.event) {
            return tryJs;
        }

        var _add , _remove;
        if(_$.zepto){
            _add = _$.fn.on, _remove = _$.fn.off;

            _$.fn.on  = makeArgsTry(_add);
            _$.fn.off  = function() {
                var arg, args = [];
                for (var i = 0, l = arguments.length; i < l; i++) {
                    arg = arguments[i];
                    _isFunction(arg) && arg.tryWrap && (arg = arg.tryWrap);
                    args.push(arg);
                }
                return _remove.apply(this, args);
            };

        }else if(window.jQuery){
            _add = _$.event.add, _remove = _$.event.remove;

            _$.event.add = makeArgsTry(_add);
            _$.event.remove = function() {
                var arg, args = [];
                for (var i = 0, l = arguments.length; i < l; i++) {
                    arg = arguments[i];
                    _isFunction(arg) && arg.tryWrap && (arg = arg.tryWrap);
                    args.push(arg);
                }
                return _remove.apply(this, args);
            };
        }

        var _ajax = _$.ajax;

        if (_ajax) {
            _$.ajax = function(url, setting) {
                if (!setting) {
                    setting = url;
                    url = undefined;
                }
                makeObjTry(setting);
                if (url) return _ajax.call(_$, url, setting);
                return _ajax.call(_$, setting);
            };
        }

        return tryJs;
    };


    /**
     * wrap amd or commonjs of function  ,exp :  define , require ,
     * @returns {Function}
     */
    tryJs.spyModules = function() {
        var _require = root.require,
            _define = root.define;
        if (_define && _define.amd && _require) {
            root.require = catArgs(_require);
            _merge(root.require, _require);
            root.define = catArgs(_define);
            _merge(root.define, _define);
        }

        if (root.seajs && _define) {
            root.define = function() {
                var arg, args = [];
                for (var i = 0, l = arguments.length; i < l; i++) {
                    arg = arguments[i];
                    if (_isFunction(arg)) {
                        arg = cat(arg);
                        //seajs should use toString parse dependencies , so rewrite it
                        arg.toString = (function(orgArg) {
                            return function() {
                                return orgArg.toString();
                            };
                        }(arguments[i]));
                    }
                    args.push(arg);
                }
                return _define.apply(this, args);
            };

            root.seajs.use = catArgs(root.seajs.use);

            _merge(root.define, _define);
        }

        return tryJs;
    };

    /**
     * wrap async of function in window , exp : setTimeout , setInterval
     * @returns {Function}
     */
    tryJs.spySystem = function() {
        root.setTimeout = catTimeout(root.setTimeout);
        root.setInterval = catTimeout(root.setInterval);
        return tryJs;
    };

    /**
     * wrap custom of function ,
     * @param obj - obj or  function
     * @returns {Function}
     */
    tryJs.spyCustom = function(obj) {
        if (_isFunction(obj)) {
            return cat(obj);
        } else {
            return makeObjTry(obj);
        }
    };

    /**
     * run spyJquery() and spyModules() and spySystem()
     * @returns {Function}
     */
    tryJs.spyAll = function() {
        tryJs.spyJquery().spyModules().spySystem();
        return tryJs;
    };

}(window));
