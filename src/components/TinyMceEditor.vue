<template>
  <div>
    <p>
      状态:
      <span id="status-span">Not Connected</span>
    </p>
    <div v-for="item in tinymceList" :key="item.id" :id="item.id"></div>
  </div>
</template>

<script>
import sharedb from 'sharedb/lib/client';
import Editor from '@tinymce/tinymce-vue'
export default {
  name: 'ShareDBEditor',
  components: {
    Editor
  },
  data() {
    return {
      socket: null,
      connection: null,
      doc: null,
      isConnected: false,
      tinymceInit: {
        height: 500,
        skin_url: '/tinymce/skins/ui/oxide',
        // plugins: 'advlist autolink link image lists charmap print preview'
        setup: (editor) => {
          editor.on('input', () => {
            console.log(editor.id, 12);

            // // 实时同步编辑器内容
            this.onInputChange(editor.id, editor.getContent())
          });
        },
      },
      tinymceList: [
        {
          id: 'editor1'
        },
        {
          id: 'editor2'
        }
      ]
    };
  },
  mounted() {
    this.initTinymce()

    this.initWebSocket();
    this.initShareDB();
  },
  methods: {

    // 初始化 WebSocket，手动实现自动重连
    initWebSocket() {
      const statusSpan = document.getElementById('status-span');
      this.socket = new WebSocket('ws://localhost:8080');

      this.socket.onopen = () => {
        this.isConnected = true;
        statusSpan.innerHTML = 'Connected';
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        statusSpan.innerHTML = 'Closed';
        setTimeout(() => this.initWebSocket(), 1000); // 1秒后尝试重新连接
      };

      this.socket.onerror = () => {
        statusSpan.innerHTML = 'Error';
      };
    },

    // 初始化 ShareDB 文档
    initShareDB() {
      // 等待 WebSocket 连接成功
      const interval = setInterval(() => {
        if (this.isConnected) {
          clearInterval(interval);
          this.connection = new sharedb.Connection(this.socket);
          // 获取文档
          this.doc = this.connection.get('examples', 'textarea');
          this.doc.subscribe((err) => {
            if (err) throw err;
            this.tinymceList.forEach(tiny => {

              // 初始化编辑器内容
              const content = this.doc.data[tiny.id] || '';
              const editor = tinymce.get(`${tiny.id}`);
              editor.setContent(content)

              // // 监听文档更改事件
              this.doc.on('op', () => {

                // console.log(this.doc.data[tiny.id]);
                //当文本框内容和更新后的文本一样时不做更新
                if (editor.getContent() !== this.doc.data[tiny.id]) {
                  console.log(tiny.id,123123);
                  
                  console.log(this.doc.data[tiny.id]);
                  if(this.doc.data[tiny.id]){
                    editor.setContent(this.doc.data[tiny.id])
                  }
                  
                }

              });
            });

          });
        }
      }, 500);
    },

    // 手动实现输入事件监听
    onInputChange(id, value) {
      if (this.doc) {
        const newContent = value;
        //同步输入内容,p:同步的字段名称,od:旧的值,oi:新的值
        this.doc.submitOp([
          { p: [`${id}`], od: this.doc.data[id] || '', oi: newContent },
        ]);
      }
    },
    //初始化tinymce
    initTinymce() {
      this.tinymceList.forEach(tiny => {
        tinymce.init({
          selector: `#${tiny.id}`,
          ...this.tinymceInit
        });
      })
    },
  },
  beforeDestroy() {
    if (this.socket) {
      this.socket.close();
    }
    if (this.connection) {
      this.connection.close();
    }
  },
};
</script>