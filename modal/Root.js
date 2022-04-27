import { vNode } from './VNode'

const ROOT = Symbol('root');

class Root extends vNode {
}

if (!window[ROOT]) {
  window[ROOT] = new Root();
}

export default window[ROOT];