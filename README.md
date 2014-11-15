# report
> client report

## Getting Started
```
// 初始化
REPORT.init({
  id: 1,
  uin: 123,
  url: "/report",
  ignore: [/Script Error:/]
});

// 手动上报
REPORT.push({
  msg: "xx load error",
  url: "/xx.js"
});

// 立即上报
REPORT.report();

// 可以链式调用
REPORT.init().push({}).report();
```

## Contributing
kael

## License
Copyright (c) 2014 kael MIT.
