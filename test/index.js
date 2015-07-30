/* global chai, mocha, BJ_REPORT */
var assert = chai.assert;
var should = chai.should();
var expect = chai.expect;

define(['../src/bj-report.js', '../src/bj-wrap.js'], function(report) {
    describe('init', function() {

        it('one report , not combo  ', function(done) {
            BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 0,
                submit: function(url) {
                    should.not.equal(url.indexOf("errorTest"), -1);
                    done();
                }
            });
            BJ_REPORT.report("errorTest");
        });


        it('one info , not combo  ', function(done) {
            BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 0,
                submit: function(url) {
                    should.not.equal(url.indexOf("errorTest"), -1);
                    should.equal(url.indexOf("level=2") > -1, true);
                    done();
                }
            });
            BJ_REPORT.info("errorTest");
        });


        it('one debug , not combo  ', function(done) {
            BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 0,
                submit: function(url) {
                    should.not.equal(url.indexOf("errorTest"), -1);
                    should.equal(url.indexOf("level=1") > -1, true);
                    done();
                }
            });
            BJ_REPORT.debug("errorTest");
        });


        it('three report , not combo  ', function(done) {
            var count = 3;
            BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 0,
                submit: function(url) {

                    if (count == 3) {
                        should.not.equal(url.indexOf("errorTest1"), -1);
                        should.equal(url.indexOf("errorTest2"), -1);
                        should.equal(url.indexOf("errorTest3"), -1);
                    }

                    if (count == 2) {
                        should.equal(url.indexOf("errorTest1"), -1);
                        should.not.equal(url.indexOf("errorTest2"), -1);
                        should.equal(url.indexOf("errorTest3"), -1);
                    }

                    if (count == 1) {
                        should.equal(url.indexOf("errorTest1"), -1);
                        should.equal(url.indexOf("errorTest2"), -1);
                        should.not.equal(url.indexOf("errorTest3"), -1);
                        done();
                    }

                    --count;

                }
            });
            BJ_REPORT.push("errorTest1");
            BJ_REPORT.push("errorTest2");
            BJ_REPORT.report("errorTest3");
            BJ_REPORT.report("errorTest3");
        });

        it('combo report , use push and report ', function(done) {

            BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 1,
                delay: 200,
                submit: function(url) {
                    var match1 = url.indexOf("errorTest1");
                    var match2 = url.indexOf("errorTest2");
                    var match3 = url.indexOf("errorTest3");
                    var match4 = url.indexOf("errorTest4");
                    var match5 = url.indexOf("count");
                    should.not.equal(match1, -1);
                    should.not.equal(match2, -1);
                    should.not.equal(match3, -1);
                    should.not.equal(match4, -1);
                    should.not.equal(match5, -1);
                    done();
                }
            });
            BJ_REPORT.push("errorTest1");
            BJ_REPORT.push("errorTest2");
            BJ_REPORT.push("errorTest3");
            BJ_REPORT.report("errorTest4");
        });


        it('combo report , onerror and report ', function(done) {

            var count = 0;
            BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 1,
                delay: 200,
                submit: function(url) {
                    count ++ ;

                }
            });
            BJ_REPORT.__onerror__("msg" , 0 , 0, null);
            BJ_REPORT.report();

            setTimeout(function (){
                should.equal(count, 1);
                done();
            },500);
        });


        it('onReport callback ', function(done) {

            var count = 0;
            BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 1,
                delay: 200,
                submit: function(url) {
                    count++;
                    should.equal(count, 2);
                    done();
                },
                onReport: function() {
                    count++;
                }
            });
            BJ_REPORT.report("errorTest4");
        });


        it('ignore report1 ', function(done) {

            var count = 0;
            BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 1,
                delay: 200,
                ignore: [
                    /ignore/gi,
                    function(error, str) {

                        if (str.indexOf("ignore2") >= 0) {
                            return true;
                        } else {
                            false;
                        }

                    }
                ],
                submit: function(url) {
                    should.equal(count, 1);
                    done();
                    BJ_REPORT.init({
                        ignore: []
                    });
                },
                onReport: function() {
                    count++;
                }
            });
            BJ_REPORT.push("ignore");
            BJ_REPORT.push("pass");
            BJ_REPORT.report("ignore2");
        });


        it('ignore report2 ', function(done) {
            var count = 0;
            BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 1,
                delay: 200,
                ignore: [
                    /ignore/gi,
                    function(error, str) {
                        return str.indexOf("ignore2") >= 0;
                    }
                ],
                submit: function(url) {
                    should.equal(count, 3);
                    done();
                    BJ_REPORT.init({
                        ignore: []
                    });
                },
                onReport: function() {
                    count++;
                }
            });
            BJ_REPORT.push("pass");
            BJ_REPORT.push("pass");
            BJ_REPORT.report("pass");
        });


        it('report Error Event', function(done, err) {

            BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 1,
                delay: 200,
                submit: function(url) {
                    var match1 =  url.indexOf("ReferenceError");
                    should.not.equal(match1, -1);
                    done();
                }
            }).tryJs().spyAll();

            try{
                error111
            }catch(e){
                BJ_REPORT.report(e);
            }

        });
    });


    describe('spy', function() {

        it('spyCustom', function(done, err) {

            var spyCustomFun = function() {
                throw "errorTest1";
            };

            spyCustomFun = BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 1,
                delay: 200,
                submit: function(url) {
                    var match1 = url.indexOf("errorTest1");
                    should.not.equal(match1, -1);
                    done();
                }
            }).tryJs().spyCustom(spyCustomFun);

            (function() {
                spyCustomFun();
            }).should.throw();
        });


        it('spyAll', function(done, err) {
            var _cb;

            window.require = function(requires, cb){

            };
            window.define = function(name, cb) {
                if (_cb) {
                    _cb();
                } else {
                    _cb = cb;
                }
            };
            window.define.amd = true;

            BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 1,
                delay: 200,
                submit: function(url) {
                    var match1 = url.indexOf("testDefine");
                    should.not.equal(match1, -1);
                    done();
                }
            }).tryJs().spyAll();

            define("testDefine", function() {
                throw "testDefine";
            });

            (function() {
                console.log(window.define)
                define();
            }).should.throw();
        });



    });
});
