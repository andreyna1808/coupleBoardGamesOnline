export interface Player {
  id: string;
  name: string;
  joinedAt: number;
}

export interface RoomState {
  players: Player[];
  hostId?: string;
}
