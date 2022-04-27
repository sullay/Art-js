import {
  vNode,
  vTextNode,
  vComponentNode
} from '../modal/VNode'
import {
  Component
} from '../modal/Component'
import $root from '../modal/Root'
// 渲染domTree
export function renderDomTree(node, parentNode) {
  if (!vNode.isVNode(node)) throw new Error("渲染元素类型有误");
  // 设置父节点
  node.$parentNode = parentNode;
  let parentDom = parentNode.getDom();
  let dom = node.getDom();
  if(!dom.parentNode) parentDom.appendChild(dom);
  // 判断是否为自定义组件
  if (node.$isComponent) {
    node.$children[0].$parentNode = node;
    for (let child of node.$children[0].$children) renderDomTree(child, node.$children[0]);
  } else {
    for (let child of node.$children) renderDomTree(child, node);
  }
}

// 渲染方法
export function render(node, parentDom) {
  $root.$dom = parentDom;
  $root.$children = [node];
  renderDomTree(node, $root);
}

// 创建元素
export function h(type, props, ..._children) {
  let children = [];
  for (let child of _children) {
    if (Array.isArray(child)) {
      children = children.concat(child);
    } else if (vNode.isVNode(child)) {
      children.push(child)
    } else {
      children.push(new vTextNode(child))
    }
  }
  if (type.prototype instanceof Component) {
    return new vComponentNode(type, props, children);
  } else {
    return new vNode(type, props, children);
  }
}