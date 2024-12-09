<template>
  <div>
    <p>
      状态:
      <span id="status-span">Not Connected</span>
    </p>
    <div v-for="item in tinymceList" :key="item.id" :id="item.id" class="editor-container">
      <!-- 显示其他用户光标 -->
      <span
        v-for="(cursor, userId) in cursors"
        :key="userId"
        :style="cursor.style"
        class="cursor-marker"
      >👆</span>
    </div>
  </div>
</template>

<script>
import sharedb from 'sharedb/lib/client';
import Editor from '@tinymce/tinymce-vue';

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
      cursors: {}, // 用于存储其他用户的光标位置
      tinymceInit: {
        height: 500,
        skin_url: '/tinymce/skins/ui/oxide',
        setup: (editor) => {
          editor.on('input', () => {
            // 实时同步编辑器内容
            this.onInputChange(editor.id, editor.getContent());
          });
          editor.on('mousemove', (event) => {
            this.updateCursorPosition(editor.id, event);
          });
        },
      },
      tinymceList: [
        { id: 'editor1' },
        { id: 'editor2' },
      ],
    };
  },
  mounted() {
    this.initTinymce();
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
          this.doc = this.connection.get('examples', 'textarea');
          this.doc.subscribe((err) => {
            if (err) throw err;

            this.initPresence(); // 初始化 Presence

            this.tinymceList.forEach((tiny) => {
              const content = this.doc.data[tiny.id] || '';
              const editor = tinymce.get(`${tiny.id}`);
              editor.setContent(content);

              this.doc.on('op', () => {
                if (editor.getContent() !== this.doc.data[tiny.id]) {
                  editor.setContent(this.doc.data[tiny.id]);
                }
              });
            });
          });
        }
      }, 500);
    },

    initPresence() {

      // 获取 Presence 对象
      this.presence = this.doc.connection.getDocPresence(this.doc.collection, this.doc.id);

      // 初始化 LocalPresence 对象
      this.localPresence = this.presence.create()
      // // 提交当前用户的 Presence 数据
      this.localPresence.submit({
        cursor: {
          editorId: 'editor1',  // 编辑器 ID
          top: 0,               // 初始光标位置
          left: 0,
          color: this.getRandomColor(), // 光标颜色
        },
      }, (err) => {
        if (err) console.error('提交 Presence 数据失败:', err);
      });
      console.log(this.localPresence);

      // 监听其他用户的 Presence 数据
      this.presence.on('receive', (userId, presenceData) => {
        if (presenceData && presenceData.cursor) {
          this.$set(this.cursors, userId, {
            style: {
              position: 'absolute',
              top: `${presenceData.cursor.top}px`,
              left: `${presenceData.cursor.left}px`,
              color: presenceData.cursor.color,
            },
          });
        } else {
          this.$delete(this.cursors, userId);
        }
      });
    },

    updateCursorPosition(editorId, event) {
      const rect = event.target.getBoundingClientRect();
      const top = event.clientY - rect.top;
      const left = event.clientX - rect.left;

      // if (this.localPresence) {
      //   this.localPresence.submit({
      //     cursor: {
      //       editorId,
      //       top,
      //       left,
      //       color: this.getRandomColor(),
      //     },
      //   }, (err) => {
      //     if (err) console.error('更新光标位置失败:', err);
      //   });
      // }
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

    // 手动实现输入事件监听
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