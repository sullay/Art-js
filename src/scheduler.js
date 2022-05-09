import { TaskList } from '../modal/Scheduler';

const taskList = new TaskList();
let isWorking = false;


function workLoop(timestamp) {
  while (taskList.getFirstTimeOut() && (performance.now() - timestamp < 5 || taskList.getFirstTimeOut() <= performance.now())) {
    let task = taskList.shift();
    task.val();
    for (const callback of task.callbackList) {
      callback();
    }
  }
  if (taskList.getFirstTimeOut()) {
    requestAnimationFrame(workLoop);
  } else {
    isWorking = false;
  }
}

export function pushTask(task) {
  taskList.put(task);
  if (!isWorking) {
    isWorking = true;
    requestAnimationFrame(workLoop)
  };
}
