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
    this.data = {};
    this.props = props;
    if (!this.constructor.$cacheMap) this.constructor.$cacheMap = {};
  }

  // 更新响应式数据
  setData(data, ...callbackList) {
    setDataFuc.call(this, data, callbackList)
  }
  setDataNow(data, ...callbackList) {
    setDataFuc.call(this, data, callbackList, PRIORITY_TYPES.IMMEDIATE_PRIORITY_TIMEOUT)
  }
  forceUpdate() {
    setDataFuc.call(this, {}, [], PRIORITY_TYPES.IMMEDIATE_PRIORITY_TIMEOUT)
  }
}

function setDataFuc(data = {}, callbackList, priority) {
  pushTask({
    key: this.$vNode,
    val: () => {
      for (const key in data) {
        this.data[key] = data[key];
      }
      this.$vNode.updateComponent();
    },
    callbackList,
    priority
  });
}