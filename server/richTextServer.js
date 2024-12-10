const http = require('http');
const express = require('express');
const ShareDB = require('sharedb');
const richText = require('rich-text');
const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');

// 注册 rich-text 类型
ShareDB.types.register(richText.type);

// 创建 ShareDB 后端实例，启用 Presence 功能
const backend = new ShareDB({ presence: true });

// 创建文档函数
async function createDoc(callback) {
  const connection = backend.connect();

  // 初始化主文档，用于 JSON 数据存储
  const doc = connection.get('examples', 'richtext');
  await doc.fetch((err) => {
    if (err) throw err;
    if (!doc.type) {
      doc.create({ editors: {} }, 'json0'); // 使用 json0 类型初始化
      console.log('Created main document with json0 type.');
    }
  });

  // 初始化光标位置文档，用于存储 rich-text 数据
  const cursorDoc = connection.get('rich-docs', 'cursor-data');
  await cursorDoc.fetch((err) => {
    if (err) throw err;
    if (!cursorDoc.type) {
      cursorDoc.create([{ insert: '' }], 'rich-text'); // 使用 rich-text 类型初始化
      console.log('Created cursor document with rich-text type.');
    }
  });

  callback(); // 启动服务器
}

// 启动服务器函数
function startServer() {
  const app = express();

  // 提供静态文件服务（替换为你的静态目录）
  app.use(express.static('static'));

  const server = http.createServer(app);

  // 初始化 WebSocket 服务器
  const wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    const stream = new WebSocketJSONStream(ws);
    backend.listen(stream);

    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed.');
    });
  });

  // 心跳检测，防止意外断开
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        console.log('Terminating dead connection...');
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // 每 30 秒发送心跳

  const port = 8080;
  server.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}

// 创建文档并启动服务器
createDoc(startServer);