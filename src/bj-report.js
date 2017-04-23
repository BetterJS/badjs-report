/*!
 * @module report
 * @author kael, chriscai
 * @date @DATE
 * Copyright (c) 2014 kael, chriscai
 * Licensed under the MIT license.
 */
var BJ_REPORT = (function(global) {
    if (global.BJ_REPORT) return global.BJ_REPORT;

    var _log_list = [];
    var _log_map = {};
    var _config = {
        id: 0, // 上报 id
        uin: 0, // user id
        url: "", // 上报 接口
        ext: null, // 扩展参数 用于自定义上报
        level: 4, // 错误级别 1-debug 2-info 4-error
        ignore: [], // 忽略某个错误, 支持 Regexp 和 Function
        random: 1, // 抽样 (0-1] 1-全量
        delay: 1000, // 延迟上报 combo 为 true 时有效
        submit: null, // 自定义上报方式
        repeat: 5 , // 重复上报次数(对于同一个错误超过多少次不上报),
        offlineLog : true,
        offlineLogExp : 5,  // 离线日志过期时间 ， 默认5天
    };

    var Offline_DB = {
        db : null,
        buffer : [],
        init : function (){
                var self = this;
                if(!window.indexedDB){
                    _config.offlineLog = false;
                }

                if(this.db){
                    return;
                }
                var version= 1;
                var request=window.indexedDB.open("badjs" , version);
                request.onerror=function(e){
                    console.log("indexdb request error");
                };
                request.onsuccess=function(e){
                    self.db = e.target.result;
                    setTimeout(function (){
                        self.addLogs(self.buffer);
                        self.buffer = [];
                    },500)

                    setTimeout(function (){
                       self.clearDB(_config.offlineLogExp );
                    },1000)

                };
                request.onupgradeneeded=function(e){
                    var db=e.target.result;
                    if(!db.objectStoreNames.contains('logs')){
                        db.createObjectStore('logs', { autoIncrement: true });
                    }
                };
        },
        insertToDB : function (log){
            var store= this.getStore()
            store.add(log);
        },
        addLog : function (log){
            if(!this.db){
                this.buffer.push(log);
                return ;
            }
            this.insertToDB(log);
        },
        addLogs : function (logs){
            if(!this.db){
                this.buffer = buffer.concat(logs);
                return
            }

            for(var i = 0;i <  this.buffer.length ; i++){
                this.addLog( this.buffer[i])
            }

        },
        clearDB : function (daysToMaintain){
            if(!this.db){
                return;
            }

            var store= this.getStore()

            if (!daysToMaintain) {
                store.clear();
                return ;
            }
            var range = (Date.now() - (daysToMaintain || 2) * 24 * 3600 * 1000);
            var request = store.openCursor();
            request.onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor && (cursor.value.time < range || !cursor.value.time)) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                }
            }
        },

        getStore: function (){
            var transaction=this.db.transaction("logs",'readwrite');
            return transaction.objectStore("logs");
        }
    }

    var T = {
        isOBJByType: function (o, type) {
            return Object.prototype.toString.call(o) === "[object " + (type || "Object") + "]";
        },

        isOBJ: function (obj) {
            var type = typeof obj;
            return type === "object" && !!obj;
        },
        isEmpty: function (obj) {
            if (obj === null) return true;
            if (T.isOBJByType(obj, "Number")) {
                return false;
            }
            return !obj;
        },
        extend : function (src , source){
            for(var key in source){
                src[key] = source[key];
            }
            return src;
        },
        processError: function (errObj) {
            try {
                if (errObj.stack) {
                    var url = errObj.stack.match("https?://[^\n]+");
                    url = url ? url[0] : "";
                    var rowCols = url.match(":(\\d+):(\\d+)");
                    if (!rowCols) {
                        rowCols = [0, 0, 0];
                    }

                    var stack = T.processStackMsg(errObj);
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
        },

        processStackMsg: function (error) {
            var stack = error.stack
                .replace(/\n/gi, "")
                .split(/\bat\b/)
                .slice(0, 9)
                .join("@")
                .replace(/\?[^:]+/gi, "");
            var msg = error.toString();
            if (stack.indexOf(msg) < 0) {
                stack = msg + "@" + stack;
            }
            return stack;
        },

        isRepeat : function(error) {
            if (!T.isOBJ(error)) return true;
            var msg = error.msg;
            var times = _log_map[msg] = (parseInt(_log_map[msg], 10) || 0) + 1;
            return times > _config.repeat;
        }
    };

    var orgError = global.onerror;
    // rewrite window.oerror
    global.onerror = function(msg, url, line, col, error) {
        var newMsg = msg;

        if (error && error.stack) {
            newMsg = T.processStackMsg(error);
        }

        if (T.isOBJByType(newMsg, "Event")) {
            newMsg += newMsg.type ?
                ("--" + newMsg.type + "--" + (newMsg.target ?
                    (newMsg.target.tagName + "::" + newMsg.target.src) : "")) : "";
        }

        report.push({
            msg: newMsg,
            target: url,
            rowNum: line,
            colNum: col
        });

        _process_log();
        orgError && orgError.apply(global, arguments);
    };



    var _report_log_tostring = function(error, index) {
        var param = [];
        var params = [];
        var stringify = [];
        if (T.isOBJ(error)) {
            error.level = error.level || _config.level;
            for (var key in error) {
                var value = error[key];
                if (!T.isEmpty(value)) {
                    if (T.isOBJ(value)) {
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



    var _offline_id  = "";
    var _save2Offline = function(key , msgObj ) {
        msgObj  = T.extend({id : _config.id , uin : _config.uin , time : new Date - 0} , msgObj);
        Offline_DB.addLog(msgObj)
    };



    var submit_log_list = [];
    var comboTimeout = 0;
    var _submit_log = function() {
        clearTimeout(comboTimeout);

        var url =_config._reportUrl + submit_log_list.join("&") + "&count=" + submit_log_list.length + "&_t=" + (+new Date);

        if (_config.submit) {
            _config.submit(url);
        } else {
            var _img = new Image();
            _img.src = url;
        }

        comboTimeout = 0;
        submit_log_list = [];
    };

    var _process_log = function(isReportNow) {
        if (!_config._reportUrl) return;

        while (_log_list.length) {
            var isIgnore = false;
            var report_log = _log_list.shift();
            // 重复上报
            if (T.isRepeat(report_log)) continue;
            var log_str = _report_log_tostring(report_log, submit_log_list.length);
            if (T.isOBJByType(_config.ignore, "Array")) {
                for (var i = 0, l = _config.ignore.length; i < l; i++) {
                    var rule = _config.ignore[i];
                    if ((T.isOBJByType(rule, "RegExp") && rule.test(log_str[1])) ||
                        (T.isOBJByType(rule, "Function") && rule(report_log, log_str[1]))) {
                        isIgnore = true;
                        break;
                    }
                }
            }
            if (!isIgnore) {
                // not offline , submit
                if(report_log.level != 20){
                    submit_log_list.push(log_str[0]);
                }
                _config.onReport && (_config.onReport(_config.id, report_log));
                _config.offlineLog && _save2Offline( "badjs_" + _config.id + _config.uin, report_log );
            }
        }

        if (isReportNow) {
            _submit_log(); // 立即上报
        } else if (!comboTimeout) {
            comboTimeout = setTimeout(_submit_log, _config.delay); // 延迟上报
        }
    };

    var report = global.BJ_REPORT = {
        push: function(msg) { // 将错误推到缓存池
            // 抽样
            if (Math.random() >= _config.random) {
                return report;
            }

            var data = T.isOBJ(msg) ? T.processError(msg) : {
                msg: msg
            };

            // ext 有默认值, 且上报不包含 ext, 使用默认 ext
            if (_config.ext && !data.ext) {
                data.ext = _config.ext;
            }
            // 在错误发生时获取页面链接
            // https://github.com/BetterJS/badjs-report/issues/19
            if (!data.from) {
                data.from = location.href;
            }
            _log_list.push(data);
            _process_log();
            return report;
        },
        report: function(msg , isReportNow) { // error report
            msg && report.push(msg);

            isReportNow && _process_log(true);
            return report;
        },
        info: function(msg) { // info report
            if (!msg) {
                return report;
            }
            if (T.isOBJ(msg)) {
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
            if (T.isOBJ(msg)) {
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

        reportOfflinelog : function (){

        },
        offlinelog : function (msg){
            if (!msg) {
                return report;
            }
            if (T.isOBJ(msg)) {
                msg.level = 20;
            } else {
                msg = {
                    msg: msg,
                    level: 20
                };
            }
            report.push(msg);
            return report;
        },
        init: function(config) { // 初始化
            if (T.isOBJ(config)) {
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

                _config._reportUrl = (_config.url || "/badjs") +
                    "?id=" + id +
                    "&uin=" + _config.uin +
                    // "&from=" + encodeURIComponent(location.href) +
                    "&";
            }

            // if had error in cache , report now
            if (_log_list.length) {
                _process_log();
            }

            // init offline
            Offline_DB.init()


            return report;
        },

        __onerror__: global.onerror
    };

    typeof console !== "undefined" && console.error && setTimeout(function() {
        var err = ((location.hash || "").match(/([#&])BJ_ERROR=([^&$]+)/) || [])[2];
        err && console.error("BJ_ERROR", decodeURIComponent(err).replace(/(:\d+:\d+)\s*/g, "$1\n"));
    }, 0);

    return report;

}(window));

if (typeof module !== "undefined") {
    module.exports = BJ_REPORT;
}
