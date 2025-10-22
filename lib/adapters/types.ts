export interface RTMessage<T = any> {
  type: string;
  payload: T;
}
export interface RealtimeAdapter {
  send: (msg: RTMessage) => void;
  onMessage: (fn: (msg: RTMessage) => void) => () => void;
  getId: () => string;
}
