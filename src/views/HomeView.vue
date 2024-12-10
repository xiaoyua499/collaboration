<template>
  <div class="home">
    <TinyMceEditor11 />
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'
import TinyMceEditor from '@/components/TinyMceEditor.vue'
import TinyMceEditor11 from '@/components/TinyMceEditor11.vue'

export default {
  name: 'HomeView',
  components: {
    HelloWorld,
    TinyMceEditor,
    TinyMceEditor11
  }
}
</script>
