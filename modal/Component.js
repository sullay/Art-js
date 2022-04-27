import {
  pushTask
} from '../src/scheduler'
import {
  PRIORITY_TYPES
} from './Scheduler'

// 自定义组件类
export class Component {
  constructor({
    props = {}
  }) {
    this.data = {}
    this.props = props;
  }

  // 更新响应式数据
  setData(data, ...callbackList) {
    setDataFuc.call(this, data, callbackList)
  }
  setDataNow(data, ...callbackList) {
    setDataFuc.call(this, data, callbackList, PRIORITY_TYPES.IMMEDIATE_PRIORITY_TIMEOUT)
  }
  forceUpdate() {
    setDataFuc.call(this)
  }
}

function setDataFuc(data = {}, callbackList, priority) {
  pushTask({
    key: this.$vNode,
    val: () => {
      // 自定义组件node的$dom指向子节点的$dom，此处赋值为null是为了触发createDom
      for (const key in data) {
        this.data[key] = data[key];
      }
      this.$vNode.updateComponent();
    },
    callbackList,
    priority
  });
}