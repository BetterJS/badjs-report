# BJ_REPORT

## Getting Started
```
// 初始化
BJ_REPORT.init({
  id: 1, // 不指定id将不上报
  uin: 123,
  url: "http://badjs2.qq.com/badjs",
  ignore: [/Script Error:/],
  level: 4 // 设置默认的级别
});

// 手动上报
BJ_REPORT.push("error msg");
BJ_REPORT.push({
  msg: "xx load error",
  url: "/xx.js",
  level: 8
});

// 立即上报
BJ_REPORT.report();
BJ_REPORT.report("error msg");
BJ_REPORT.report({
  msg: "xx load error",
  url: "/xx.js"
});

// 可以链式调用
BJ_REPORT.init({id: 1}).push("error msg").report("error msg 2");
```

## Contributing
kael,chriscai

## License
Copyright (c) 2014 kael MIT.
