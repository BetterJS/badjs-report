/* global chai, mocha */
var assert = chai.assert;
var expect = chai.expect;

mocha.setup({
    ui: 'bdd'
});

require.config({
    baseUrl: '../src/',

    paths: {
        'jquery': '../node_modules/jquery/dist/jquery.min'
    }
});
