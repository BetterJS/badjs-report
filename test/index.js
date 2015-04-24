/* global chai, mocha */
var assert = chai.assert;
var should = chai.should();
var expect = chai.expect;

//define(['../dist/bj-reportWrap.js'], function(report) {
define(['../src/bj-report.js' , '../src/bj-wrap.js'], function(report) {
    describe('init', function() {

        it('one report , not combo  ', function(done) {
            BJ_REPORT.init({
                id : 1 ,
                url : "http://test.qq.com/report",
                combo : 0 ,
                submit : function (url){
                    should.not.equal( url.indexOf("errorTest") , -1)
                    done();
                }
            });
            BJ_REPORT.report("errorTest")
        });


        it('three report , not combo  ', function(done) {
            var count = 3;
            BJ_REPORT.init({
                id : 1 ,
                url : "http://test.qq.com/report",
                combo : 0 ,
                submit : function (url){

                    if(count == 3){
                        should.not.equal( url.indexOf("errorTest1") , -1);
                        should.equal( url.indexOf("errorTest2") , -1);
                        should.equal( url.indexOf("errorTest3") , -1);
                    }

                    if(count == 2){
                        should.equal( url.indexOf("errorTest1") , -1);
                        should.not.equal( url.indexOf("errorTest2") , -1);
                        should.equal( url.indexOf("errorTest3") , -1);
                    }

                    if(count == 1){
                        should.equal( url.indexOf("errorTest1") , -1);
                        should.equal( url.indexOf("errorTest2") , -1);
                        should.not.equal( url.indexOf("errorTest3") , -1);
                        done();
                    }

                    --count ;

                }
            });
            BJ_REPORT.push("errorTest1");
            BJ_REPORT.push("errorTest2");
            BJ_REPORT.report("errorTest3");
        });

        it('combo report ', function(done) {

            BJ_REPORT.init({
                id : 1 ,
                url : "http://test.qq.com/report",
                combo:1,
                delay : 200,
                submit : function (url){
                    var match1 = url.indexOf("errorTest1");
                    var match2 = url.indexOf("errorTest2");
                    var match3 = url.indexOf("count");
                    should.not.equal( match1 , -1);
                    should.not.equal( match2 , -1);
                    should.not.equal( match3 , -1);
                    done();
                }
            });
            BJ_REPORT.report("errorTest1");
            BJ_REPORT.report("errorTest2");
        });


        it('combo report , use push and report ', function(done) {

            BJ_REPORT.init({
                id : 1 ,
                url : "http://test.qq.com/report",
                combo:1,
                delay : 200,
                submit : function (url){
                    var match1 = url.indexOf("errorTest1");
                    var match2 = url.indexOf("errorTest2");
                    var match3 = url.indexOf("errorTest3");
                    var match4 = url.indexOf("errorTest4");
                    var match5 = url.indexOf("count");
                    should.not.equal( match1 , -1);
                    should.not.equal( match2 , -1);
                    should.not.equal( match3 , -1);
                    should.not.equal( match4 , -1);
                    should.not.equal( match5 , -1);
                    done();
                }
            });
            BJ_REPORT.push("errorTest1");
            BJ_REPORT.push("errorTest2");
            BJ_REPORT.push("errorTest3");
            BJ_REPORT.report("errorTest4");
        });

    });


    describe('spy', function() {

        it('spyCustom', function (done , err) {


            var spyCustomFun = function (){
                throw "errorTest1";
            }

            spyCustomFun = BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 1,
                delay: 200,
                submit: function (url) {
                    var match1 = url.indexOf("errorTest1");
                    should.not.equal( match1 , -1);
                    done();
                }
            }).
                tryJs().spyCustom(spyCustomFun );

            spyCustomFun();

        });


        it('spyAll', function (done , err) {

            define("testDefine", function(){
                throw "testDefine";
            })

            BJ_REPORT.init({
                id: 1,
                url: "http://test.qq.com/report",
                combo: 1,
                delay: 200,
                submit: function (url) {
                    var match1 = url.indexOf("testDefine");
                    should.not.equal( match1 , -1);
                    done();
                }
            }).
                tryJs().spyAll();

            require(["testDefine"] , function (){});

        });
    })
});
