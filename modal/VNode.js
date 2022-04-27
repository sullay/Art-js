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
    let stack = [
      [_newNodes, _preNodes, _parentNode]
    ];
    while (stack.length) {
      let [newNodes, preNodes, parentNode, parentNodeBefore] = stack.pop();
      if (!newNodes.length) {
        preNodes.forEach(node => node.$dom && node.$dom.remove());
        continue;
      }
      // while (newNodes.length < preNodes.length) {
      //   let node = preNodes.shift();
      //   node.$dom.remove();
      // }
      if (newNodes.length < preNodes.length) {
        preNodes = preNodes.concat(preNodes.splice(0, preNodes.length - newNodes.length))
      }
      // 所有旧node
      let preMap = new Map();
      for (const node of preNodes) {
        if (!preMap.has(node.$type)) preMap.set(node.$type, []);
        if (node.$dom) preMap.get(node.$type).push(node);
      }
      //  指向同层级上一个节点
      let beforeNode = null;
      for (const node of newNodes) {
        if (preMap.has(node.$type) && preMap.get(node.$type).length) {
          node.$parentNode = parentNode;
          let preNode = preMap.get(node.$type).shift();
          if (node.$isComponent) {
            // 自定义组件，复用旧的组件实例
            node.$instance = preNode.$instance;
            // 组件实例$vNode指向新的node
            node.$instance.$vNode = node;
            if (!node.$instance.shouldComponentUpdate || !node.$instance.shouldComponentUpdate(node.$props)) {
              node.$children = preNode.$children;
              node.$dom = preNode.$dom;
              node.$children[0].$parentNode = node;
            } else {
              node.$instance.props = node.$props;
              // 更新自定义组件虚拟dom树
              let child = node.$instance.render();
              node.$children = [child];
              stack.push([node.$children, preNode.$children, node, beforeNode]);
            }
          } else {
            vNode.updateDom(node, preNode);
            stack.push([node.$children, preNode.$children, node]);
          }
        } else if (parentNode.$isComponent) {
          // 没有复用的自定义组件节点更新
          let dom = parentNode.getDom();
          if (parentNodeBefore) {
            parentNodeBefore.$dom.after(dom);
          } else if (parentNode.$parentNode.$dom.firstChild) {
            parentNode.$parentNode.$dom.firstChild.before(dom);
          } else {
            parentNode.$parentNode.$dom.appendChild(dom);
          }
          renderDomTree(parentNode, parentNode.$parentNode);
        } else {
          // 没有复用的普通节点更新
          let dom = node.getDom();
          if (beforeNode) {
            beforeNode.$dom.after(dom);
          } else if (parentNode.$dom.firstChild) {
            parentNode.$dom.firstChild.before(dom);
          } else {
            parentNode.$dom.appendChild(dom);
          }
          renderDomTree(node, parentNode);
        }
        beforeNode = node;
      }
      // 自定义组件设置dom
      if (parentNode.$isComponent && !parentNode.$dom) parentNode.$dom = newNodes[0].getDom();
      preMap.forEach(list => {
        if (!list.length) return;
        list.forEach(node => node.$dom && node.$dom.remove())
      })
    }
  }
}