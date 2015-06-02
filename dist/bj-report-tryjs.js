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
        var newmsg = msg;

        if(error && error.stack){
            newmsg = error.stack.replace(/\n/gi, '').split(/\bat\b/).slice(0,5).join("@").replace(/\?[^:]+/gi , "");
        }

        _error.push({
            msg: newmsg,
            target: url,
            rowNum: line,
            colNum: col
            /*error : error*/
           /* stack : stack*/
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

        // 合并上报
        var count = error_list.length;
        if (count) {
            var comboReport = function(){
                clearTimeout(comboTimeout);
                _submit(_config.report + error_list.join("&") + "&count=" + count + "&_t=" + (+new Date));
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
            _error.push(_isOBJ(msg) ? msg : {
                msg: msg
            });
            return report;
        },
        report: function(msg) { // 立即上报
            msg && report.push(msg);
            _send(true);
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
        },

        __onerror__ : global.onerror

    };

    return report;
}(window));

if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = BJ_REPORT;
    }
    exports.BJ_REPORT = BJ_REPORT;
}
;(function (root) {

    if (!root.BJ_REPORT) {
        return;
    }

    var _onthrow = function (errObj) {
        try {
            if (errObj.stack) {
                var url = errObj.stack.match('http://[^\n]+');
                url = url ? url[0] : "";
                var rowCols = url.match(':([0-9]+):([0-9]+)');
                if(!rowCols ){
                    rowCols= [0 , 0 ,0];
                }

                var stack = errObj.stack.replace(/\n/gi, '').split(/\bat\b/).slice(0,5).join("@").replace(/\?[^:]+/gi , "");
                root.BJ_REPORT.report({
                    msg: stack,
                    rowNum: rowCols[1],
                    colNum: rowCols[2],
                    target: url.replace(rowCols[0], '')
                   /* stack : stack*/
                });
            } else {
                root.BJ_REPORT.report(errObj);
            }
        } catch (err) {
            root.BJ_REPORT.report(errObj);
        }

    };

    var tryJs = root.BJ_REPORT.tryJs = function init(throwCb) {
        throwCb && ( _onthrow =throwCb );


        return tryJs;
    };


    // merge
    var _merge = function (org, obj) {
        var key;
        for (key in obj) {
            org[key] = obj[key];
        }
    };

    // function or not
    var _isFunction = function (foo) {
        return typeof foo === 'function';
    };

    var cat = function (foo, args) {
        return function () {
            try {
                return foo.apply(this, args || arguments);
            } catch (err) {
                try {
                    return foo.apply(this, args || arguments);
                } catch (error) {

                    _onthrow(error);

                    //some browser throw error (chrome) , can not find error where it throw,  so print it on console;
                    if( error.stack && console && console.error){
                        console.error("[BJ-REPORT]" , err.stack);
                    }

                    // hang up browser and throw , but it should trigger onerror , so rewrite onerror then recover it
                    var orgOnerror = root.onerror;
                    root.onerror = function (){};
                    setTimeout(function(){
                        root.onerror = orgOnerror;
                    },50);

                    throw error;
                }
            }
        };
    };

    var catArgs = function (foo) {
        return function () {
            var arg, args = [];
            for (var i = 0, l = arguments.length; i < l; i++) {
                arg = arguments[i];
                _isFunction(arg) && (arg = cat(arg));
                args.push(arg);
            }
            return foo.apply(this, args);
        };
    };

    var catTimeout = function (foo) {
        return function (cb, timeout) {
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
    var makeArgsTry = function (foo, self) {
        return function () {
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
    var makeObjTry = function (obj) {
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
    tryJs.spyJquery = function () {
        var _$ = root.$;

        if (!_$ || !_$.event) {
            return tryJs;
        }

        var _add = _$.event.add,
            _ajax = _$.ajax,
            _remove = _$.event.remove;

        if (_add) {
            _$.event.add = makeArgsTry(_add);
            _$.event.remove = function () {
                var arg, args = [];
                for (var i = 0, l = arguments.length; i < l; i++) {
                    arg = arguments[i];
                    _isFunction(arg) && (arg = arg.tryWrap);
                    args.push(arg);
                }
                return _remove.apply(this, args);
            };
        }

        if (_ajax) {
            _$.ajax = function (url, setting) {
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
    tryJs.spyModules = function () {
        var _require = root.require,
            _define = root.define;
        if (_define && _define.amd && _require) {
            root.require = catArgs(_require);
            _merge(root.require, _require);
            root.define = catArgs(_define);
            _merge(root.define, _define);
        }

        if ( root.seajs && _define ) {
            root.define =  function () {
                var arg, args = [];
                for (var i = 0, l = arguments.length; i < l; i++) {
                    arg = arguments[i];
                    if(_isFunction(arg)){
                        arg = cat(arg);
                        //seajs should use toString parse dependencies , so rewrite it
                        arg.toString =(function (orgArg){
                            return function (){
                                return  orgArg.toString();
                            };
                        }(arguments[i]));
                    }
                    args.push(arg);
                }
                return _define.apply(this, args);
            };
        }

        return tryJs;
    };

    /**
     * wrap async of function in window , exp : setTimeout , setInterval
     * @returns {Function}
     */
    tryJs.spySystem = function () {
        root.setTimeout = catTimeout(root.setTimeout);
        root.setInterval = catTimeout(root.setInterval);
        return tryJs;
    };


    /**
     * wrap custom of function ,
     * @param obj - obj or  function
     * @returns {Function}
     */
    tryJs.spyCustom = function (obj) {
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
    tryJs.spyAll = function () {
        tryJs.spyJquery().spyModules().spySystem();
        return tryJs;
    };







}(window));



