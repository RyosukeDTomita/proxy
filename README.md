# Weather-apiのproxy
## 環境構築

Thunder client(VSCode Extensions)

## パッケージ作成手順(リポジトリ作成時に実行)

```shell
npm init -y # パッケージの初期化
# ライブラリインストール
npm install express
npm install -g nodemon
npm install http-proxy-middleware
npm install dotenv
```

## node.jsを使ったプロキシでフロント側のurlの記載を隠蔽する
- urlにフロント側から与える引数(都市名等)が渡されない場合はそのまま書き換え可能。 --> `http://localhost:5050/weather-data?key=9df07ac867d54877abe63526232606&q=${city}&api=no`のようにフロントから渡すことでurlのみ隠蔽可能。

```js
const express = require("express");
const app = express();
const { createProxyMiddleware } = require("http-proxy-middleware");

app.get("/", (req, res) => {
  res.send("This is my proxy server"); // localhost:5050にアクセスした際にブラウザ画面に出すコメント
});

app.use("/weather-data", (req, res, next) => {
  createProxyMiddleware({
    target: "https://api.weatherapi.com/v1/current.json", // このプロキシサーバからアクセスしたいデータのurl
    changeOrigin: true,
    pathRewrite: {
      [`^/weather-data`]: "",
    },
  })(req, res, next);
});

// windowsでは5000はException: Interval report folderが出るので変更。
app.listen(5050, () => {
  console.log("Listening on localhost port 5050"); // ターミナルに出力するコメント
});
```
- ?や＆等をプロキシ側に記載してフロント側の引数を受け取らずに代理アクセスすることはできない。 --> localhost:5050/weather-data&q=${city}&api=noのようにクライアントからアクセスはできない。

```js
// 悪い例
app.use("/weather-data", (req, res, next) => {
  createProxyMiddleware({
    target: "https://api.weatherapi.com/v1/current.json?key=9df07ac867d54877abe63526232606", // このプロキシサーバからアクセスしたいデータのurl
    changeOrigin: true,
    pathRewrite: {
      [`^/weather-data`]: "",
    },
  })(req, res, next);
});
```
- 引数を使うならフロントからnode側に渡してやる必要がある。

```js
// フロント

const getWeather = (e: React.FormEvent<HTMLFormElement>) => {
	e.preventDefault(); // フォームを送信するたびに画面をリロードしない。
    fetch(
      `http://localhost:5050/weather-data?${city}`
    )``

```js
// プロキシ
const express = require("express");
const app = express();
const { createProxyMiddleware } = require("http-proxy-middleware");
const url = require("url");

app.get("/", (req, res) => {
  res.send("This is my proxy server"); // localhost:5050にアクセスした際にブラウザ画面に出すコメント
});

app.use("/weather-data", limiter, (req, res, next) => {
  const city = url.parse(req.url).query; // クライアントから都市名を受け取る
  createProxyMiddleware({
    target: `https://api.weatherapi.com/v1/current.json?key=9df07ac867d54877abe63526232606&q=${city}&api=no`,
    changeOrigin: true, // リクエストのoriginが変更されるため、CORSエラーを回避できる。
    pathRewrite: {
      // プロキシサーバーに送信されるリクエストのURLパスをリライトする。
      [`^/weather-data`]: "",
    },
  })(req, res, next);
});

// windowsでは5000はException: Interval report folderが出るので変更。
app.listen(5050, () => {
  console.log("Listening on localhost port 5050"); // ターミナルに出力するコメント
});
```
