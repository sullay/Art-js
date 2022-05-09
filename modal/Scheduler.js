const MAX_LEVEL = 16;
const HEAD = Symbol('HEAD');
const TAIL = Symbol('TAIL');


export const PRIORITY_TYPES = {
  IMMEDIATE_PRIORITY_TIMEOUT: -1,
  HIGH_BLOCKING_PRIORITY_TIMEOUT: 250,
  NORMAL_PRIORITY_TIMEOUT: 1000,
  LOW_PRIORITY_TIMEOUT: 5000,
  IDLE_PRIORITY_TIMEOUT: 1073741823,
}

// 单个任务
export class Task {
  constructor(key, val, callbackList, priority) {
    this.key = key;
    // 任务的方法
    this.val = val;
    // 任务的所有回调函数
    this.callbackList = callbackList;
    // 任务最后超时时间
    this.timeout = performance.now() + priority;
  }
}
// 任务节点包装一层标记前后任务
class Node {
  constructor({ key, val = () => { }, callbackList = [], priority = PRIORITY_TYPES.NORMAL_PRIORITY_TIMEOUT } = {}) {
    this.task = new Task(key, val, callbackList, priority);
    // 跳表各层级后一个节点
    this.next = new Array(MAX_LEVEL).fill(null);
    // 跳表各层级前一个节点
    this.pre = new Array(MAX_LEVEL).fill(null);
  }
}

// 任务列表
export class TaskList {
  constructor() {
    // 使用map可以通过key值直接定位到目标任务
    this.map = new Map();
    // 跳表最大层级
    this.maxLevel = 0;
    // 跳表头
    this.head = new Node({ key: HEAD });
    // 跳表尾
    this.tail = new Node({ key: TAIL });
    // 空跳表链接收尾
    for (let i = 0; i < MAX_LEVEL; i++) {
      this.head.next[i] = this.tail;
      this.tail.pre[i] = this.head;
    }
  }
  // 获取当前节点层级
  static getLevel() {
    let level = 1;
    for (let i = 1; i < MAX_LEVEL; i++) {
      if (Math.random() > 0.5) level++;
    }
    return level;
  }
  // 通过任务key获取任务
  get(key) {
    return this.map.get(key);
  }
  // 判断是否存在任务
  has(key) {
    return this.map.has(key);
  }
  // 获取最紧急任务的超时时间
  getFirstTimeOut() {
    if (this.head.next[0] === this.tail) return null;
    return this.head.next[0].task.timeout;
  }

  // 取出首个任务
  shift() {
    // 任务为空
    if (this.head.next[0] === this.tail) return null;
    // 首个任务
    let currentNode = this.head.next[0];
    // 从跳表中删除首个任务
    for (let i = this.maxLevel - 1; i >= 0; i--) {
      if (currentNode.next[i] && currentNode.pre[i]) {
        currentNode.pre[i].next[i] = currentNode.next[i];
        currentNode.next[i].pre[i] = currentNode.pre[i];
      }
      // 删除后判断当前层级是否为空，空则最大高度-1
      if (this.head.next[i] === this.tail) this.maxLevel--;
    }
    // 删除map中的任务
    this.map.delete(currentNode.task.key);
    return currentNode.task;
  }

  // 添加任务，如果已经存在相同key的任务，更新任务方法，回调函数合并到callbackList，并根据超时时间移动位置。
  put({ key = Symbol('default'), val = () => { }, callbackList = [], priority = PRIORITY_TYPES.NORMAL_PRIORITY_TIMEOUT }) {
    if (this.has(key)) {
      // 已经存在key值相同的任务
      // 获取相同key值任务
      let node = this.get(key);
      // 计算新任务的超时时间
      let timeout = performance.now() + priority;
      // 旧任务重新赋值
      node.task.val = val;
      // 合并新旧任务回调函数
      node.task.callbackList = node.task.callbackList.concat(callbackList);
      // 如果新任务更紧急，则修改过期时间，并移动位置
      if (timeout < node.task.timeout) {
        // 赋值超时时间
        node.timeout = timeout;
        let level = this.maxLevel;
        let nextNode = node.next[level - 1];
        // 计算当前任务的层级与最高层级的下一个任务
        while (!nextNode) {
          level--;
          nextNode = node.next[level - 1];
        }
        // 从跳表中删除该任务
        for (let i = level - 1; i >= 0; i--) {
          node.pre[i].next[i] = node.next[i];
          node.next[i].pre[i] = node.pre[i];
        }
        // 各层级插入新的位置
        for (let i = level - 1; i >= 0; i--) {
          while (nextNode.pre[i] !== this.head && nextNode.pre[i].timeout > node.task.timeout) {
            nextNode = nextNode.pre[i];
          }
          node.next[i] = nextNode;
          node.pre[i] = nextNode.pre[i];
          nextNode.pre[i] = node;
          node.pre[i].next[i] = node;
        }
      }
    } else {
      // 不存在key值相同的任务
      // 生成当前任务跳表层级
      let level = TaskList.getLevel();
      // 创建任务
      let node = new Node({ key, val, callbackList, priority });
      // 将新任务插入map
      this.map.set(key, node);
      // 将任务根据超时时间插入跳表，超时时间相同插入到最后
      let preNode = this.head;
      for (let i = level - 1; i >= 0; i--) {
        while (preNode.next[i] !== this.tail && preNode.next[i].task.timeout <= node.task.timeout) {
          preNode = preNode.next[i];
        }
        node.pre[i] = preNode;
        node.next[i] = preNode.next[i];
        preNode.next[i] = node;
        node.next[i].pre[i] = node;
      }
      // 重新赋值跳表最大层级
      if (level > this.maxLevel) this.maxLevel = level;
    }
  }
}