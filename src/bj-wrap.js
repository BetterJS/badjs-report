(function (root) {

    if (!root.BJ_REPORT) {
        return;
    }


    // err had stack
    try {
        throw new Error("testError");
    } catch (err) {
        if (!err.stack) {
            return;
        }
    }

    var _onthrow = function (errObj) {
        try {
            if (errObj.stack) {
                var url = errObj.stack.match('http://[^\n]+')[0];
                var rowCols = url.match(':([0-9]+):([0-9]+)');
                var msg = errObj.stack.replace(/\n/gi, '@').replace(/at[\s]/gi, '');
                root.BJ_REPORT.report({
                    msg: msg,
                    rowNum: rowCols[1],
                    colNum: rowCols[2],
                    target: url.replace(rowCols[0], '')
                });
            } else {
                root.BJ_REPORT.report(errObj);
            }
        } catch (err) {
            root.BJ_REPORT.report(err);
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
                _onthrow(err);
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
        if (_require && _define) {
            root.require = catArgs(_require);
            _merge(root.require, _require);
            root.define = catArgs(_define);
            _merge(root.define, _define);
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



