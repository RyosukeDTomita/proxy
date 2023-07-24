const express = require("express");
const app = express();
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();
const url = require("url");
const rateLimit = require("express-rate-limit");

// アクセス数の制限をもうける時間幅をミリ秒で指定する。15分で1000回までアクセスという制限をかけている。
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // HTTP Headerのx-ratelimit-limitに対応。x-ratelimit-remainingが残り回数で超えると429 Too many requests
});

// プロキシ全体にlimiterを適用する。
// app.use(limiter)

app.get("/", (req, res) => {
  res.send("This is my proxy server"); // localhost:5050にアクセスした際にブラウザ画面に出すコメント
});

app.use("/weather-data", limiter, (req, res, next) => {
  const city = url.parse(req.url).query; // クライアントから都市名を受け取る
  createProxyMiddleware({
    // target: `https://api.weatherapi.com/v1/current.json?key=9df07ac867d54877abe63526232606&q=${city}&api=no`,
    target: `${process.env.WEATHER_DATA_URL}${city}&api=no`,
    changeOrigin: true, // リクエストのoriginが変更されるため、CORSエラーを回避できる。
    pathRewrite: {
      // プロキシサーバーに送信されるリクエストのURLパスをリライトする。
      [`^/weather-data`]: "",
    },
  })(req, res, next);
});

// windowsでは5000はException: Interval report folderが出るので変更。
const port = process.env.PORT || 5050;
app.listen(5050, () => {
  console.log(`Listening on localhost port ${port}`); // ターミナルに出力するコメント
});
