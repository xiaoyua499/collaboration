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
import { initWebSocket, initShareDB, onInputChange,socketDestroy } from '@/services/services'
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
            // 实时同步编辑器内容
            onInputChange(editor.id, editor.getContent())
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
    this.init()
  },
  methods: {
    init() {
      this.initTinymce()
      initWebSocket();
      initShareDB(this.tinymceList);
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
    socketDestroy()
  },
};
</script>