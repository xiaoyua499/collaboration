import sharedb from 'sharedb/lib/client';

let socket = null// WebSocket 连接
let isConnected = false// 是否连接
let connection = null// ShareDB 连接
let doc = null// ShareDB 文档
// 初始化 WebSocket，手动实现自动重连
export const initWebSocket = () => {
  socket = new WebSocket('ws://localhost:8080');

  socket.onopen = () => {
    isConnected = true;
  };

  socket.onclose = () => {
    isConnected = false;
    setTimeout(() => initWebSocket(), 1000); // 1秒后尝试重新连接
  };

  socket.onerror = () => {
    console.error('WebSocket error');
  };
}

// 初始化 ShareDB 文档
export const initShareDB = (tinymceList) => {
  console.log(tinymceList);
  
  // 等待 WebSocket 连接成功
  const interval = setInterval(() => {
    if (isConnected) {
      clearInterval(interval);
      connection = new sharedb.Connection(socket);
      // 获取文档
      doc = connection.get('examples', 'textarea');
      doc.subscribe((err) => {
        if (err) throw err;
        tinymceList.forEach(tiny => {

          // 初始化编辑器内容
          const content = doc.data[tiny.id] || '';
          const editor = tinymce.get(`${tiny.id}`);
          editor.setContent(content)

          // // 监听文档更改事件
          doc.on('op', () => {

            // console.log(doc.data[tiny.id]);
            //当文本框内容和更新后的文本一样时不做更新
            if (editor.getContent() !== doc.data[tiny.id]) {
              if (doc.data[tiny.id]) {
                editor.setContent(doc.data[tiny.id])
              }
            }
          });
        });
      });
    }
  }, 500);
};

/**
 * 监听输入框内容变化
 * @param {string} id tinymce的id
 * @param {*} value 输入框内容
 */
export const onInputChange = (id, value) => {
  if (doc) {
    const newContent = value;
    //同步输入内容,p:同步的字段名称,od:旧的值,oi:新的值
    doc.submitOp([
      { p: [`${id}`], od: doc.data[id] || '', oi: newContent },
    ]);
  }
}
export const socketDestroy = ()=>{
  if (socket) {
    socket.close();
  }
  if (connection) {
    connection.close();
  }
}