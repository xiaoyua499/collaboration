<template>
  <div class="home">
    <TinyMceEditor />
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'
import TinyMceEditor from '@/components/TinyMceEditor.vue'

export default {
  name: 'HomeView',
  components: {
    HelloWorld,
    TinyMceEditor
  }
}
</script>
