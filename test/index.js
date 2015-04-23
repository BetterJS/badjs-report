/* global chai, mocha */
var assert = chai.assert;

define(['../dist/bj_report'], function(report) {
    describe('report', function() {
        describe('example', function() {
            it('should return 5', function() {
                assert.equal(5, 2 + 3);
            });
        });
    });
});
