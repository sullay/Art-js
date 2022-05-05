import { TaskList } from '../modal/Scheduler';

const taskList = new TaskList();
let isWorking = false;


function workLoop() {
  while (taskList.length) {
    let task = taskList.shift();
    task.val();
  }
  isWorking = false;
}

export function pushTask(key, val) {
  taskList.put(key, val);
  if (!isWorking) {
    isWorking = true;
    _requestAnimationFrame(workLoop);
  };
}

function _requestAnimationFrame(workLoop) {
  Promise.resolve().then(() => {
    workLoop();
  })
}