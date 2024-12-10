<template>
  <div>
    <p>
      状态:
      <span id="status-span">Not Connected</span>
    </p>
    <div v-for="item in tinymceList" :key="item.id" :id="item.id" class="editor-container">
      
    </div>
    <!-- 显示其他用户光标 -->
      <span
        v-for="(cursor,index) in cursors"
        :key="index"
        :style="cursor.style"
        class="cursor-marker"
      >👆</span>
  </div>
</template>

<script>
import sharedb from 'sharedb/lib/client';
import richText from 'rich-text'; // 引入 rich-text 类型
import Editor from '@tinymce/tinymce-vue';

sharedb.types.register(richText.type); // 注册 rich-text 类型

export default {
  name: 'ShareDBEditor',
  components: {
    Editor,
  },
  data() {
    return {
      socket: null,
      connection: null,
      doc: null,
      presence: null,
      isConnected: false,
      cursors: [], // 存储其他用户的光标位置
      tinymceInit: {
        height: 500,
        skin_url: '/tinymce/skins/ui/oxide',
        setup: (editor) => {
          editor.on('input', () => {
            // 实时同步编辑器内容
            this.onInputChange(editor.id, editor.getContent());
          });
          editor.on('mousemove',(e)=>{
            this.handleMouseMove(e)
          })
        },
      },
      tinymceList: [
        { id: 'editor1' },
        // { id: 'editor2' },
      ],
      cursorDoc: null,
      userId: null,
    };
  },
  mounted() {
    this.initTinymce();
    this.initWebSocket();
    this.initShareDB();
    // 全局监听鼠标移动事件
    window.addEventListener('mousemove', this.handleMouseMove);
  },
  methods: {
    // 初始化 WebSocket
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
        setTimeout(() => this.initWebSocket(), 1000);
      };

      this.socket.onerror = () => {
        statusSpan.innerHTML = 'Error';
      };
    },

    // 初始化 ShareDB 文档
    initShareDB() {
      const interval = setInterval(() => {
        if (this.isConnected) {
          clearInterval(interval);
          this.connection = new sharedb.Connection(this.socket);
          this.doc = this.connection.get('examples', 'richtext');
          this.doc.subscribe((err) => {
            if (err) throw err;

            if (!this.doc.type) {
              this.doc.create({ content: '' }, 'json0');
            }

            this.tinymceList.forEach((tiny) => {
              const content = this.doc.data[tiny.id] || '';
              const editor = tinymce.get(`${tiny.id}`);
              editor.setContent(content);

              this.doc.on('op', () => {
                if (editor.getContent() !== this.doc.data[tiny.id]) {
                  console.log(this.doc.data);

                  if (this.doc.data[tiny.id]) {
                    editor.setContent(this.doc.data[tiny.id])
                  }
                }
              });
            });
          });
          // 初始化 rich-text 文档（光标位置）
          this.cursorDoc = this.connection.get('rich-docs', 'cursor-data');
          this.cursorDoc.subscribe((err) => {
            if (err) throw err;
            if (!this.cursorDoc.type) {
              this.cursorDoc.create([{ insert: '' }], 'rich-text');
            }
            this.initPresence();
          });
        }
      }, 500);

    },

    // 初始化 Presence
    initPresence() {

      this.presence = this.cursorDoc.connection.getDocPresence(this.cursorDoc.collection, this.cursorDoc.id);
      this.presence.subscribe()
      this.localPresence = this.presence.create();

      this.localPresence.submit(
        { cursor: { editorId: 'editor1', top: 0, left: 0, color: this.getRandomColor() } },
        (err) => {
          if (err) console.error('提交 Presence 数据失败:', err);
        }
      );

      this.presence.on('receive', (userId, presenceData) => {
        console.log(userId, presenceData);

        if (presenceData && presenceData.cursor) {
          let found = false;
          for (let i = 0; i < this.cursors.length; i++) {
            if (this.cursors[i].id === userId) {
              // 如果找到相同的 userId，更新 cursor 数据
              this.cursors[i].style = {
                position: 'absolute',
                top: `${presenceData.cursor.top}px`,
                left: `${presenceData.cursor.left}px`,
                color: presenceData.cursor.color,
              };
              found = true;
              break;
            }
          }

          if (!found) {
            // 如果没有找到相同的 userId，添加新的 cursor 数据
            this.cursors.push({
              id: userId,
              style: {
                position: 'absolute',
                top: `${presenceData.cursor.top}px`,
                left: `${presenceData.cursor.left}px`,
                color: presenceData.cursor.color,
              },
            });
          }
        }

        console.log(this.cursors);

      });
    },

    // 提交输入内容
    onInputChange(id, value) {
      if (this.doc) {
        const newContent = value;
        this.doc.submitOp([
          { p: [`${id}`], od: this.doc.data[id] || '', oi: newContent },
        ]);
      }
    },

    // 初始化 TinyMCE
    initTinymce() {
      this.tinymceList.forEach((tiny) => {
        tinymce.init({
          selector: `#${tiny.id}`,
          ...this.tinymceInit,
        });
      });
    },

    // 获取随机颜色
    getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },
    handleMouseMove(event) {
      const top = event.clientY; // 鼠标在页面中的垂直坐标
      const left = event.clientX; // 鼠标在页面中的水平坐标

      if (this.localPresence) {
        this.localPresence.submit({
          cursor: {
            top,
            left,
            color: this.getRandomColor(), // 光标颜色
          },
        }, (err) => {
          if (err) console.error('更新光标位置失败:', err);
        });
      }
    },
  },
  beforeDestroy() {
    if (this.socket) {
      this.socket.close();
    }
    if (this.connection) {
      this.connection.close();
    }
    // 移除全局鼠标事件监听
    window.removeEventListener('mousemove', this.handleMouseMove);
  },
};
</script>

<style>
.editor-container {
  position: relative;
}

.cursor-marker {
  position: absolute;
  font-size: 14px;
  pointer-events: none;
}
</style>