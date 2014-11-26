# BJ_REPORT

## Getting Started
```
// 初始化
BJ_REPORT.init({
  id: 1,
  uin: 123,
  url: "http://badjs2.qq.com/badjs",
  ignore: [/Script Error:/]
});

// 手动上报
BJ_REPORT.push("error msg");
BJ_REPORT.push({
  msg: "xx load error",
  url: "/xx.js"
});

// 立即上报
BJ_REPORT.report();
BJ_REPORT.report("error msg");
BJ_REPORT.report({
  msg: "xx load error",
  url: "/xx.js"
});

// 可以链式调用
BJ_REPORT.init({}).push("error msg").report();
```

## Contributing
kael

## License
Copyright (c) 2014 kael MIT.
