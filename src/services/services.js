import sharedb from 'sharedb/lib/client';

let socket = null// WebSocket 连接
let isConnected = false// 是否连接
let connection = null// ShareDB 连接
let doc = null// ShareDB 文档
let X6Doc = null// X6 图谱数据
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
export const initShareDB = (tinymceList, graph) => {
  console.log(tinymceList, graph);

  // 等待 WebSocket 连接成功
  const interval = setInterval(() => {
    if (isConnected) {
      clearInterval(interval);
      connection = new sharedb.Connection(socket);
      if (tinymceList) {
        initTinyDoc(tinymceList)
      }
      if (graph) {
        initX6Doc(graph)
      }
    }
  }, 500);
};

export const initTinyDoc = (tinymceList) => {
  // 获取文档
  doc = connection.get('examples', 'textarea');

  doc.subscribe((err) => {
    if (err) throw err;
    tinymceList.forEach(tiny => {

      // 初始化编辑器内容
      if (!doc.data[tiny.id]) {
        doc.submitOp([{ p: [tiny.id], oi: '<p></p>' }], { source: 'init' });
      }
      const content = doc.data[tiny.id] || '<p></p>';
      const editor = tinymce.get(`${tiny.id}`);

      editor.setContent(content)
      // 监听文档更改事件
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

//初始化x6 Sharedb
export const initX6Doc = (graph) => {
  // 获取文档
  X6Doc = connection.get('examples', 'X6Node');

  X6Doc.subscribe((err) => {
    if (err) throw err;
    // 如果文档尚未创建，则进行初始化
    if (!X6Doc.type) {
      X6Doc.create({ nodes: {} }, (createErr) => {
        if (createErr) throw createErr;
        console.log('Document created successfully.');

        // 初始化完成后添加默认节点
        X6Doc.submitOp([{ p: ['nodes', 'node1'], oi: '' }], { source: 'init' });
      });
    }

    // 监听文档更改事件
    X6Doc.on('op', () => {
      updateGraphFromDoc(graph);
    });
  });
}

export const updateGraphFromDoc = (graph) => {
  const data = X6Doc.data;
  Object.keys(data.nodes).forEach((id) => {
    const position = data.nodes[id];
    let node = graph.getCellById(id);

    if (node) {
      node.position(position.x, position.y);
    } 
  });
}

export const submitOpX6 = (id, position) => {
  X6Doc.submitOp([{ p: ['nodes', id], oi: position }]);
}

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
export const socketDestroy = () => {
  if (socket) {
    socket.close();
  }
  if (connection) {
    connection.close();
  }
}