export type SpaceKind = "neighborhood" | "building" | "floor" | "dm";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  buildingId: string;
  floorId: string;
  room: string;
  program: string;
};

export type Space = {
  id: string;
  kind: SpaceKind;
  name: string;
  blurb: string;
  memberIds: string[];
};

export type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type Post = {
  id: string;
  spaceId: string;
  authorId: string;
  body: string;
  createdAt: string;
  pinned?: boolean;
  likedBy: string[];
  comments: Comment[];
};

export type Message = {
  id: string;
  spaceId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type AppState = {
  posts: Post[];
  messages: Message[];
  openedDmIds: string[];
};
