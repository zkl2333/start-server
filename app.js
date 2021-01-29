"use strict";

const Koa = require("koa");
const AV = require("leanengine");

// 加载云函数定义。
// 您可以将其拆分为多个文件，但不要忘记将它们加载到主文件中。
require("./cloud");

const app = new Koa();

// 加载 leanengine 中间件
app.use(AV.koa());

app.use(async (ctx, next) => {
  try {
    await next(); // next is now a function
  } catch (err) {
    ctx.body = { message: err.message };
    ctx.status = err.status || 500;
  }
});

app.use(async (ctx) => {
  ctx.body = "Hello World";
});

module.exports = app;
