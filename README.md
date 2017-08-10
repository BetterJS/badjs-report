badjs-report -- 前端日志上报与JS异常监控
---

[![Build Status](https://travis-ci.org/BetterJS/badjs-report.svg?branch=master)](https://travis-ci.org/BetterJS/badjs-report)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/BetterJS?utm_source=share-link&utm_medium=link&utm_campaign=share-link)
## Author
[caihuiji](https://github.com/caihuiji) [yorts52](https://github.com/yorts52)

## Install

```shell
$ npm install badjs-report
```
```shell
$ bower install https://github.com/BetterJS/badjs-report.git
```
```shell
$ lego install badjs-report --save
```

## Getting Started
> badjs-report 必须在所有类库之前加载并初始化。
> 但是要在 jquery、seajs、requrejs等类库后调用spyAll()。

##### 初始化
```javascript
BJ_REPORT.init({
  id: 1                                 // 不指定 id 将不上报
});
```
##### 配置说明
```javascript
BJ_REPORT.init({
  id: 1,                                // 上报 id, 不指定 id 将不上报
  uin: 123,                             // 指定用户 id, (默认已经读取 qq uin)
  delay: 1000,                          // 当 combo 为 true 可用，延迟多少毫秒，合并缓冲区中的上报（默认）
  url: "//badjs2.qq.com/badjs",         // 指定上报地址
  ignore: [/Script error/i],            // 忽略某个错误
  random: 1,                            // 抽样上报，1~0 之间数值，1为100%上报（默认 1）
  repeat: 5,                            // 重复上报次数(对于同一个错误超过多少次不上报)
                                        // 避免出现单个用户同一错误上报过多的情况
  onReport: function(id, errObj){},     // 当上报的时候回调。 id: 上报的 id, errObj: 错误的对象
  submit,                               // 覆盖原来的上报方式，可以自行修改为 post 上报等
  ext: {}                               // 扩展属性，后端做扩展处理属性。例如：存在 msid 就会分发到 monitor,
  offlineLog : false,                    // 是否启离线日志 [默认 false]
  offlineLogExp : 5,                    // 离线有效时间，默认最近5天
});
```
BJ_Report 是重写了 window.onerror 进行上报的，无需编写任何捕获错误的代码

#####  手动上报
```javascript
BJ_REPORT.report("error msg");

BJ_REPORT.report({
  msg: "xx load error",                 // 错误信息
  target: "xxx.js",                     // 错误的来源js
  rowNum: 100,                          // 错误的行数
  colNum: 100,                          // 错误的列数
});

try{
    // something throw error ...
}catch(error){
    BJ_REPORT.report(e);
}
```

#####  延迟上报

```javascript
BJ_REPORT.push("error msg");

BJ_REPORT.push({
  msg: "xx load error",                 // 错误信息
  target: "xxx.js",                     // 错误的来源js
  rowNum: 100,                          // 错误的行数
  colNum: 100,                          // 错误的列数
});

BJ_REPORT.report();

```

#####  上报离线日志  

```javascript
BJ_REPORT.reportOfflineLog();
```

> 什么是离线日志？ [#25](https://github.com/BetterJS/badjs-report/issues/25)

#####  用法
```javascript
//初始化
BJ_REPORT.init({id: 1})

//主动上报错误日志
BJ_REPORT.report("error msg 2");

//info上报，用于记录操作日志
BJ_REPORT.info("info");

//可以结合实时上报，跟踪问题; 不存入存储
BJ_REPORT.debug("debug");

//记录离线日志  
BJ_REPORT.offlineLog("offlineLog");
```
<br/>

### 高级用法
>script error  的错误，怎么解决？  [#3](https://github.com/BetterJS/badjs-report/issues/3)

由于 BJ_Report 只是重写了onerror 方法而已，而且浏览器的跨域问题不能获得外链 javascript 的错误，所以使用tryJs  进行包裹。
#### 包裹jquery
```javascript
BJ_REPORT.tryJs().spyJquery();
```
包裹 jquery 的 event.add , event.remove , event.ajax 这几个异步方法。
<br/>
<br/>
#### 包裹 define , require
```javascript
BJ_REPORT.tryJs().spyModules();
```
包裹 模块化框架 的 define , require 方法
<br/>
<br/>
#### 包裹  js 默认的方法
```javascript
BJ_REPORT.tryJs().spySystem();
```
包裹 js 的 setTimeout , setInterval 方法
<br/>
<br/>
#### 包裹 自定义的方法
```javascript
var customFunction = function (){};
customFunction  = BJ_REPORT.tryJs().spyCustom(customFunction );

// 只会包裹 customOne  , customTwo
var customObject = { customOne : function (){} , customTwo : function (){} , customVar : 1}
BJ_REPORT.tryJs().spyCustom(customObject );
```
包裹 自定义的方法或则对象
<br/>
<br/>
#### 运行所有默认的包裹
```javascript
//自动运行 SpyJquery , SpyModule , SpySystem
BJ_REPORT.tryJs().spyAll();
```

## update log
##### v1.3.3
1. BUGFIX

##### v1.3.1
1. 支持离线日志
2. 支持自动上报离线日志

##### v1.2.3
1. BUGFIX

##### v1.2.1
1. 增加去除重复参数
2. 修复了 webpack 引入问题
3. BUGFIX

##### v1.1.8
1. 项目重命名后更新项目路径(注: 之前名字为`report`)

##### v1.1.7
1. 合并上报的问题
2. 增加sea.use try-catch 处理

##### v1.1.6
1. add BJ_ERROR hash

##### v1.1.5
1. bugfix

##### v1.1.4
1. 增加info 和 debug 接口
2. report 增加对 error 对象处理
3. 处理 [Object event] 问题

##### v1.1.3
1. bugfix

##### v1.1.2
1. 增加抽样参数 random

##### v1.1.1
1. seajs 兼容的BUG修复
2. 增加 ext 属性，用户可以自己定义里面的值上报

##### v1.1.0
1. 增加对seajs 模块化的包裹
2. 增加对IE下面的错误的上报

##### v1.0.5
1. 修复异步环境下抛给浏览器的BUG也会上报，
2. 修复ignore 数组判断的迭代的问题

##### v1.0.4
1. 修复 spy 插件增加在 异步环境中，抛出异常捕获后，再抛给浏览器
2. 修复 增加在异步环境中，抛出异常，捕获后，将错误信息输出
3. 增加onReport 回调

##### v1.0.3
1. 修复说明文档

##### v1.0.2
1. 修复 uin 的正则

##### v1.0.1
1. 增加 spy 插件

##### v1.0.0
1. 功能上线
