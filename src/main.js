import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false
import tinymce from 'tinymce/tinymce';
// 如果需要插件和主题，按需引入
import 'tinymce/themes/silver'; // 默认主题
import 'tinymce/icons/default'; // 默认图标
import 'tinymce/plugins/link'; // 示例插件：超链接
import 'tinymce/plugins/image'; // 示例插件：图片
import 'tinymce/plugins/code'; // 示例插件：代码编辑
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
