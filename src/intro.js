/*!
 * @module intro
 * @author kael
 * @date @DATE
 * Copyright (c) 2014 kael
 * Licensed under the MIT license.
 */
window.__error__ = window.__error__ || [];
window.onerror = function(msg, url, line, col, error) {
    window.__error__.push({
        msg: msg,
        url: url || location.href,
        line: line,
        col: col,
        error: error
    });
};
