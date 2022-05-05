import {
  pushTask
} from '../src/scheduler'

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
  setData(data) {
    setDataFuc.call(this, data)
  }

  forceUpdate() {
    setDataFuc.call(this, {})
  }
}

function setDataFuc(data = {}) {
  pushTask(
    this.$vNode,
    () => {
      for (const key in data) {
        this.data[key] = data[key];
      }
      this.$vNode.updateComponent();
    }
  );
}