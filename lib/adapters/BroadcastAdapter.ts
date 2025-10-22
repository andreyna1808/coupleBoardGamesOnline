import { RealtimeAdapter, RTMessage } from "./types";

export class BroadcastAdapter implements RealtimeAdapter {
  private ch: BroadcastChannel;
  private id = Math.random().toString(36).slice(2, 10);

  constructor(roomCode: string) {
    this.ch = new BroadcastChannel(`room-${roomCode}`);
  }
  send(msg: RTMessage) {
    this.ch.postMessage(msg);
  }
  onMessage(fn: (m: RTMessage) => void) {
    const h = (e: MessageEvent) => fn(e.data);
    this.ch.addEventListener("message", h as any);
    return () => this.ch.removeEventListener("message", h as any);
  }
  getId() {
    return this.id;
  }
}
