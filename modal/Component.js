import { animationFrameScheduler, PRIORITY_TYPE } from 'web-scheduler'

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
  setData(data, callback) {
    setDataFuc.call(this, data, callback)
  }
  setDataNow(data, callback) {
    setDataFuc.call(this, data, callback, PRIORITY_TYPE.IMMEDIATE)
  }
  forceUpdate() {
    setDataFuc.call(this, {}, undefined, PRIORITY_TYPE.IMMEDIATE)
  }
}

function setDataFuc(data = {}, callback, priority) {
  animationFrameScheduler.pushTask(() => {
    for (const key in data) {
      this.data[key] = data[key];
    }
    this.$vNode.updateComponent();
  },{
    key: this.$vNode,
    callback,
    priority
  })
}