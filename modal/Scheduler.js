// 单个任务
export class Task {
  constructor(key, val = () => { }) {
    this.key = key;
    this.val = val;
    this.next = null;
    this.pre = null;
  }
}

// 任务列表
export class TaskList {
  constructor() {
    this.map = new Map();
    this.head = new Task('head');
    this.tail = new Task('tail');
    this.head.next = this.tail;
    this.tail.pre = this.head;
    this.length = 0;
  }
  // 取出首个任务
  shift() {
    if (this.length <= 0) return null;
    let task = this.head.next;
    task.pre.next = task.next;
    task.next.pre = task.pre;
    this.map.delete(task.key);
    this.length--;
    return task;
  }
  // 添加任务，如果已经存在相同key的任务，更新任务方法，并将该任务移动到队尾
  put(key, val = () => { }) {
    let task;
    if (this.map.has(key)) {
      task = this.map.get(key);
      task.pre.next = task.next;
      task.next.pre = task.pre;
      task.val = val;
    } else {
      task = new Task(key, val);
      this.map.set(key, task);
      this.length++;
    }
    task.pre = this.tail.pre;
    task.next = this.tail;
    this.tail.pre = task;
    task.pre.next = task;
  }
}