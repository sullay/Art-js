// 判断是否属于事件
export function isEvent(key) {
  return key.startsWith('on');
}
// 处理事件名
export function getEventName(key) {
  return key.toLowerCase().replace(/^on/, "");
}