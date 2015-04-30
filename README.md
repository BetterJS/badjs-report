# BJ_REPORT

# Installation
``` javascript
npm install bj-report
```

## Getting Started
##### 初始化
``` javascript
BJ_REPORT.init({
  id: 1,                                // 不指定id将不上报
  uin: 123,                             // 指定用户 number
  combo:0,								// combo 是否合并上报， 0 关闭， 1 启动（默认）
  delay, 100							// 当 combo= 1 可用，延迟多少毫秒，合并缓冲区中的上报
  url: "http://badjs2.qq.com/badjs",    // 指定上报地址
  ignore: [/Script Error:/],            // 忽略某个错误
  level: 4 // 设置默认的级别              // 上报等级   // 1-debug 2-info 4-error 8-fail
});
```
BJ_Report 是重写了 window.error 进行上报的，无需编写任何捕获错误的代码
<br/>
#####  手动上报
``` javascript
BJ_REPORT.report();
BJ_REPORT.report("error msg");
BJ_REPORT.report({
  msg: "xx load error",
  url: "/xx.js"
});
```
当 combo = 1 时候的， 调用 report 立即上报错误；<br/>
当 combo = 0 时候的， 会延迟 delay 毫秒，再合并上报
<br/>
#####  延迟上报
``` javascript
BJ_REPORT.push("error msg");
BJ_REPORT.push({
  msg: "xx load error",
  url: "/xx.js",
  level: 8
});
BJ_REPORT.report();
```
当 combo = 1 时候的， 调用 report ，根据缓冲池中的数据一条条上报;<br/>
当 combo = 0 时候的， 会延迟 delay 毫秒，再合并上报
<br/>


#####  可以链式调用
``` javascript
BJ_REPORT.init({id: 1}).push("error msg").report("error msg 2");
```
<br/>
<br/>
### 高级用法
由于 BJ_Report 只是重写了onerror 方法而已，而且浏览器的跨域问题不能获得外链 javascript 的错误，所以使用tryjs  进行包裹。
#### 包裹jquery
``` javascript
BJ_REPORT.tryjs().spyJquery();
```
包裹 jquery 的 event.add , event.remove , event.ajax 这几个异步方法。
<br/>
<br/>
#### 包裹 define , require
``` javascript
BJ_REPORT.tryjs().spyModules();
```
包裹 模块化框架 的 define , require 方法
<br/>
<br/>
#### 包裹  js 默认的方法
``` javascript
BJ_REPORT.tryjs().spySystem();
```
包裹 js 的 setTimeout , setInterval 方法
<br/>
<br/>
#### 包裹 自定义的方法
``` javascript
var customFunction = function (){};
customFunction  = BJ_REPORT.tryjs().spyCustom(customFunction );

// 只会包裹 customOne  , customTwo
var customObject = { customOne : function (){} , customTwo : function (){} , customVar : 1}
BJ_REPORT.tryjs().spyCustom(customObject );
```
包裹 自定义的方法或则对象
<br/>
<br/>
#### 运行所有默认的包裹
``` javascript
//自动运行 SpyJquery , SpyModule , SpySystem
BJ_REPORT.tryjs().spyAll();
```







