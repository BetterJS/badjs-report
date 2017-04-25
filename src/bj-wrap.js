(function(global) {

    if (!global.BJ_REPORT) {
        console.error("please load bg-report first");
        return;
    }

    var _onthrow = function(errObj) {
        global.BJ_REPORT.push(errObj);
    };

    var tryJs = {};
    global.BJ_REPORT.tryJs = function(throwCb) {
        throwCb && (_onthrow = throwCb);
        return tryJs;
    };

    // merge
    var _merge = function(org, obj) {
        for (var key in obj) {
            org[key] = obj[key];
        }
    };

    // function or not
    var _isFunction = function(foo) {
        return typeof foo === "function";
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
                    var orgOnerror = global.onerror;
                    global.onerror = function() {};
                    timeoutkey = setTimeout(function() {
                        global.onerror = orgOnerror;
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
            if (typeof cb === "string") {
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
                if(_isFunction(arg)){
                    if(arg.tryWrap){
                        arg = arg.tryWrap;
                    }else {
                        tmp = cat(arg);
                        arg.tryWrap = tmp;
                        arg = tmp;
                    }
                }
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
        var _$ = global.$;

        if (!_$ || !_$.event) {
            return tryJs;
        }

        var _add, _remove;
        if (_$.zepto) {
            _add = _$.fn.on, _remove = _$.fn.off;

            _$.fn.on = makeArgsTry(_add);
            _$.fn.off = function() {
                var arg, args = [];
                for (var i = 0, l = arguments.length; i < l; i++) {
                    arg = arguments[i];
                    _isFunction(arg) && arg.tryWrap && (arg = arg.tryWrap);
                    args.push(arg);
                }
                return _remove.apply(this, args);
            };

        } else if (window.jQuery) {
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
        var _require = global.require,
            _define = global.define;
        if (_define && _define.amd && _require) {
            global.require = catArgs(_require);
            _merge(global.require, _require);
            global.define = catArgs(_define);
            _merge(global.define, _define);
        }

        if (global.seajs && _define) {
            global.define = function() {
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

            global.seajs.use = catArgs(global.seajs.use);

            _merge(global.define, _define);
        }

        return tryJs;
    };

    /**
     * wrap async of function in window , exp : setTimeout , setInterval
     * @returns {Function}
     */
    tryJs.spySystem = function() {
        global.setTimeout = catTimeout(global.setTimeout);
        global.setInterval = catTimeout(global.setInterval);
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
        tryJs
            .spyJquery()
            .spyModules()
            .spySystem();
        return tryJs;
    };

}(window));
