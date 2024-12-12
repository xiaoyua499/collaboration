<template>
  <div class="home">
    <!-- <TinyMceEditor /> -->
    <div id="container"></div>
  </div>
</template>

<script>
import { Graph, Shape, FunctionExt, Addon, DataUri } from '@antv/x6'
import '@antv/x6-vue-shape'
import TinyMceEditor from '@/components/TinyMceEditor.vue'
import TinyMceEditor11 from '@/components/TinyMceEditor11.vue'
import tinymce from 'tinymce';
import { initWebSocket, submitOpX6, initShareDB } from '@/services/services'


export default {
  name: 'index',
  components: {
    TinyMceEditor,
    TinyMceEditor11
  },
  data() {
    return {
      graph: null,
      tinymceList: [
        {
          id: 'editor1'
        },
        {
          id: 'editor2'
        }
      ]
    }
  },
  mounted() {
    this.init()
    this.initGraphData()
    initWebSocket();
    initShareDB(this.tinymceList, this.graph);
  },
  methods: {
    init() {
      const graph = new Graph({
        container: document.getElementById('container'),
        width: 1000,
        height: 2000,
        grid: true,
        panning: {
          enabled: true,
        },
        selecting: {
          enabled: false,

        },
        interacting: {
          nodeMovable: true,
          edgeMovable: false,
          nodeResizable: true,
          edgeResizable: true,
          nodeDeletable: false,
          edgeDeletable: false,
          nodeCloneable: true,
          edgeCloneable: true,
          useNodeSelectionStyle: false,
          wheelSensitivity: 0.1,
        },
        clipboard: {
          enabled: true,
          useLocalStorage: true,
        },
        keyboard: {
          enabled: true,
          global: true,
        },
        snapline: true,
        history: true,
        grid: false,
        transforming: {
          clearAll: true,
          clearOnBlankMouseDown: true,
        },
        connecting: {
          anchor: "center",
          connectionPoint: "anchor",
          snap: true,
          allowBlank: false,
          allowLoop: false,
          allowNode: false,
          createEdge() {
            return new Shape.Edge({
              attrs: {
                line: {
                  stroke: '#5B8FF9',
                  strokeWidth: 4,
                  targetMarker: {
                    name: 'classic',
                    size: 8
                  },
                  strokeDasharray: 0,
                  style: {
                    animation: 'ant-line 30s infinite linear',
                  }
                }
              },
              label: {
                text: '',

              },
              connector: {
                name: 'rounded',
                args: {
                  radius: 10
                }
              },
              router: {
                name: 'manhattan',
              },
              zIndex: 0
            })
          }
        },
        resizing: {
          enabled: false,
        },
        rotating: {
          enabled: false,
          grid: 15
        }

      })
      // Graph.registerVueComponent('tinymce-editor', {
      //   template: `<tinymce-editor></tinymce-editor>`,
      //   components: {
      //     TinyMceEditor
      //   }
      // }, true)
      Graph.registerNode("tinymce-editor", {
        inherit: "vue-shape",
        x: 200,
        y: 150,
        width: 500,
        height: 500,
        component: TinyMceEditor,
      });

      this.graph = graph
      // 监听节点位置变化并同步到 ShareDB
      this.graph.on('node:change:position', ({ node }) => {
        const id = node.id;
        const position = node.position();
        submitOpX6(id, position)
        // this.doc.submitOp([{ p: ['nodes', id], oi: position }]);
      });
    },
    initGraphData() {
      const data = {
        // 节点
        nodes: [
          {
            id: "node1",
            shape: "tinymce-editor",
            x: 400,
            y: 150,
            width: 500,
            height: 500,
            data: {
              tinymceList: [
                {
                  id: 'editor1'
                },
                {
                  id: 'editor2'
                }
              ]
            },
          },
          // {
          //   id: 'node2', // String，节点的唯一标识
          //   shape: "tinymce-editor",
          //   x: 400,      // Number，必选，节点位置的 x 值
          //   y: 600,      // Number，必选，节点位置的 y 值
          //   width: 500,   // Number，可选，节点大小的 width 值
          //   height: 500,  // Number，可选，节点大小的 height 值
          //   data: {
          //     tinymceList:[
          //       {
          //         id: 'editor3'
          //       },
          //       {
          //         id: 'editor4'
          //       }
          //     ]
          //   },
          // },
        ],
        // // 边
        // edges: [
        //   {
        //     source: 'node1', // String，必须，起始节点 id
        //     target: 'node2', // String，必须，目标节点 id
        //   },
        // ],
      };
      const graph = this.graph
      graph.fromJSON(data)
    }
  }
}
</script>
