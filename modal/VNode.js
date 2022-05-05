import {
  isEvent,
  getEventName
} from '../util'
import {
  renderDomTree
} from '../src/render'
// 普通元素
export class vNode {
  constructor(type = '', allProps = {}, children = []) {
    this.$type = type;
    this.$props = {};
    this.$events = {};
    for (let prop in allProps) {
      if (isEvent(prop)) {
        // 从props中过滤出事件监听
        this.$events[getEventName(prop)] = allProps[prop];
      } else {
        this.$props[prop] = allProps[prop];
      }
    }
    // 处理子元素中的文字类元素
    this.$children = children;
  }
  // 判断是否属于虚拟Dom元素
  static isVNode(node) {
    return node instanceof this;
  }
  // 获取node的dom
  getDom() {
    if (!this.$dom) this.createDom();
    return this.$dom;
  }
  // 创建dom
  createDom() {
    this.$dom = document.createElement(this.$type);
    // 设置属性
    for (let key in this.$props) {
      if (key.includes('-')) {
        this.$dom.setAttribute(key, this.$props[key]);
      } else {
        this.$dom[key] = this.$props[key];
      }
    }
    // 监听事件
    for (let event in this.$events) this.$dom.addEventListener(event, this.$events[event]);
  }
  // 旧的node中的dom根据新node重新赋值
  static updateDom(newNode, preNode) {
    let dom = preNode.$dom;
    for (let key in newNode.$props) {
      if (newNode.$props[key] !== preNode.$props[key]) {
        key.includes('-') ? dom.setAttribute(key, newNode.$props[key]) : dom[key] = newNode.$props[key];
      }
    }
    for (let key in preNode.$props) {
      if (!newNode.$props[key]) {
        key.includes('-') ? dom.setAttribute(key, '') : dom[key] = '';
      }
    }
    for (let key in newNode.$events) {
      if (newNode.$events[key] !== preNode.$events[key]) {
        dom.removeEventListener(key, preNode.$events[key]);
        dom.addEventListener(key, newNode.$events[key]);
      }
    }
    for (let key in preNode.$events) {
      if (!newNode.$events[key]) dom.removeEventListener(key, preNode.$events[key]);
    }
    newNode.$dom = dom;
  }
}

// 文字元素
export class vTextNode extends vNode {
  constructor(text) {
    super(vTextNode.type, {
      nodeValue: text
    })
  }
  static type = Symbol('TEXT_ELEMENT');
  createDom() {
    this.$dom = document.createTextNode('');
    // 设置属性
    for (let key in this.$props) this.$dom[key] = this.$props[key];
  }
}

export class vComponentNode extends vNode {
  constructor(type = '', allProps = {}) {
    super(type, allProps);
    // 标识自定义组件
    this.$isComponent = true;
    this.$type = 'vComponent_' + this.$type.name;
    this.$typeClass = type;
    // 创建组件实例
    this.$instance = new type({
      props: this.$props
    });
    this.$instance.$vNode = this;
  }
  createDom() {
    let child = this.$instance.render();
    this.$children = [child];
    this.$dom = child.getDom();
  }
  updateComponent() {
    let preChildren = this.$children;
    let child = this.$instance.render();
    this.$children = [child];
    vComponentNode.diffDom(this.$children, preChildren, this);
    this.$dom = child.getDom();
  }

  static diffDom(_newNodes = [], _preNodes = [], _parentNode) {
    let queue = [
      [_newNodes, _preNodes, _parentNode]
    ];
    while (queue.length) {
      let [newNodes, preNodes, parentNode] = queue.shift();
      if (!newNodes.length) {
        if (preNodes.length) {
          parentNode.$dom.textContent = "";
          preNodes.forEach(node => {
            if (node.$isComponent && node.$props.key && node.$typeClass.$cacheMap) node.$typeClass.$cacheMap[node.$props.key] = undefined;
          });
        }
        continue;
      }
      // 所有旧node
      const preMap = {}
      for (let i = 0; i < preNodes.length; i++) {
        let node = preNodes[i];
        node.beforeNodeIndex = i - 1;
        if (node.$props.key) {
          preMap[node.$props.key] = node;
          continue;
        }
        if (!preMap[node.$type]) preMap[node.$type] = [];
        if (node.$dom) preMap[node.$type].push(node);
      }
      //  指向同层级上一个节点
      let beforeNode = null;
      for (const node of newNodes) {
        let preNode = null
        if (preMap[node.$props.key]) {
          const tempNode = preMap[node.$props.key];
          if (tempNode && tempNode.$type === node.$type) {
            preNode = tempNode;
            preMap[node.$props.key] = null;
          }
        }
        if (!preNode && preMap[node.$type] && preMap[node.$type].length) {
          const tempNodeList = preMap[node.$type]
          if (tempNodeList.length) preNode = tempNodeList.shift()
        }
        if (preNode) {
          node.$parentNode = parentNode;
          if (node.$isComponent) {
            if (node !== preNode) {
              // 自定义组件，复用旧的组件实例
              node.$instance = preNode.$instance;
              // 组件实例$vNode指向新的node
              node.$instance.$vNode = node;

              node.$instance.props = node.$props;
              // 更新自定义组件虚拟dom树
              let child = node.$instance.render();
              node.$children = [child];
              vComponentNode.diffDom(node.$children, preNode.$children, node);
            }
          } else {
            vNode.updateDom(node, preNode);
            queue.push([node.$children, preNode.$children, node]);
          }
          if (beforeNode && beforeNode.$dom !== preNodes[preNode.beforeNodeIndex].$dom) {
            beforeNode.$dom.after(node.$dom);
          }
        } else {
          // 没有复用的普通节点更新
          let dom = node.getDom();
          if (beforeNode) {
            beforeNode.$dom.after(dom);
          } else if (parentNode.$dom.firstChild) {
            parentNode.$dom.firstChild.before(dom);
          }
          renderDomTree(node, parentNode);
        }
        beforeNode = node;
      }
      // 自定义组件设置dom
      if (parentNode.$isComponent && !parentNode.$dom) parentNode.$dom = newNodes[0].getDom();
      Object.values(preMap).forEach(list => {
        if (!list) return;
        if (Array.isArray(list)) {
          list.forEach(node => node.$dom && node.$dom.remove());
        } else if (list.$dom) {
          list.$dom.remove();
          if (list.$isComponent && list.$props.key && list.$typeClass.$cacheMap) list.$typeClass.$cacheMap[list.$props.key] = undefined;
        }
      })
    }
  }
}