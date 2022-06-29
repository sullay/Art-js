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
  if (!vNode.isVNode(node)) throw new Error("渲染节点类型有误");
  // 设置父节点
  node.$parentNode = parentNode;
  let parentDom = parentNode.getDom();
  let dom = node.getDom();
  if (!dom.parentNode) parentDom.appendChild(dom);
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

// 创建虚拟dom节点
export function h(type, props, ..._children) {
  // 处理子节点
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
  // 自定义组件类型虚拟dom
  if (type.prototype instanceof Component) {
    // 记忆虚拟树中读取缓存
    let cacheNode = props && props.key &&
      type.$cacheMap && type.$cacheMap[props.key];
    // 节点没有更新时，直接返回缓存
    if (cacheNode && cacheNode.$instance &&
      (!cacheNode.$instance.shouldComponentUpdate ||
        !cacheNode.$instance.shouldComponentUpdate(props))) {
      return cacheNode;
    }
    // 没有缓存或者缓存有更新时创建创新的虚拟dom节点
    let node = new vComponentNode(type, props);
    // 如果新生成的节点存在key值，则写入缓存
    if (props && props.key) type.$cacheMap[props.key] = node;
    return node;
  } else {
    return new vNode(type, props, children);
  }
}