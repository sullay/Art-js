import { TaskList } from '../modal/Scheduler';

const taskList = new TaskList();
let isWorking = false;

function workLoop(timestamp) {
  // 存在任务、并且当前帧占用时间少于5ms时或者首个任务已超时则执行
  while (taskList.getFirstTimeOut() &&
    (performance.now() - timestamp < 5 ||
      taskList.getFirstTimeOut() <= performance.now())) {
    let task = taskList.shift();
    // 执行任务
    task.val();
    // 执行回调
    for (const callback of task.callbackList) callback();
  }
  if (taskList.getFirstTimeOut()) {
    // 如果队列中存在任务，下一帧raf阶段执行
    requestAnimationFrame(workLoop);
  } else {
    // 不存在任务，停止调度
    isWorking = false;
  }
}

export function pushTask(task) {
  // 插入任务
  taskList.put(task);
  // 如果任务调度未启动，启动调度，并在下一帧raf阶段执行。
  if (!isWorking) {
    isWorking = true;
    requestAnimationFrame(workLoop)
  };
}
