import type { Message, Post, Space, User } from "./types";

export const PASSWORD = "sammen";

export const buildings = [
  { id: "a", name: "Blokk A", complex: "AB-blokken" },
  { id: "b", name: "Blokk B", complex: "AB-blokken" },
  { id: "c", name: "Blokk C", complex: "Blokk C og D" },
  { id: "d", name: "Blokk D", complex: "Blokk C og D" },
  { id: "e", name: "Blokk E", complex: "Langblokken" },
  { id: "f", name: "Blokk F", complex: "Langblokken" },
  { id: "g", name: "Blokk G", complex: "Langblokken" },
  { id: "h", name: "Blokk H", complex: "Langblokken" },
  { id: "l", name: "Blokk L", complex: "Familieboliger" },
  { id: "m", name: "Blokk M", complex: "Blokk M" },
  { id: "n", name: "Blokk N", complex: "Blokk N" },
  { id: "r", name: "Blokk R", complex: "Blokk R og S" },
  { id: "s", name: "Blokk S", complex: "Blokk R og S" },
];

const floors = [
  { id: "f-3", buildingId: "f", name: "Etasje 3" },
  { id: "b-2", buildingId: "b", name: "Etasje 2" },
  { id: "r-5", buildingId: "r", name: "Etasje 5" },
];

export const users: User[] = [
  {
    id: "emma",
    name: "Emma Berg",
    email: "emma@sammen.no",
    password: PASSWORD,
    buildingId: "f",
    floorId: "f-3",
    room: "F314",
    program: "Informatikk",
  },
  {
    id: "jonas",
    name: "Jonas Hauge",
    email: "jonas@sammen.no",
    password: PASSWORD,
    buildingId: "f",
    floorId: "f-3",
    room: "F308",
    program: "Økonomi",
  },
  {
    id: "sara",
    name: "Sara Nilsen",
    email: "sara@sammen.no",
    password: PASSWORD,
    buildingId: "b",
    floorId: "b-2",
    room: "B207",
    program: "Medisin",
  },
  {
    id: "malik",
    name: "Malik Olsen",
    email: "malik@sammen.no",
    password: PASSWORD,
    buildingId: "r",
    floorId: "r-5",
    room: "R512",
    program: "Jus",
  },
];

export function findUser(id: string): User | undefined {
  return users.find((user) => user.id === id);
}

export function buildingById(id: string) {
  return buildings.find((building) => building.id === id);
}

export function buildingLabel(id: string): string {
  return buildingById(id)?.name ?? "Blokk";
}

export function authenticate(email: string, password: string): User | null {
  const normalized = email.trim().toLowerCase();
  return users.find((user) => user.email === normalized && user.password === password) ?? null;
}

export function dmId(a: string, b: string): string {
  const [first, second] = [a, b].sort();
  return `dm:${first}:${second}`;
}

export function otherInDm(spaceId: string, viewerId: string): User | undefined {
  const ids = spaceId.split(":").slice(1);
  if (!ids.includes(viewerId)) return undefined;
  const otherId = ids.find((id) => id !== viewerId);
  return otherId ? findUser(otherId) : undefined;
}

export function dmSpace(viewer: User, other: User): Space {
  return {
    id: dmId(viewer.id, other.id),
    kind: "dm",
    name: other.name,
    blurb: `${other.program} · rom ${other.room}`,
    memberIds: [viewer.id, other.id].sort(),
  };
}

export function spacesFor(user: User): Space[] {
  const building = buildingById(user.buildingId);
  const floor = floors.find((item) => item.id === user.floorId);
  if (!building || !floor) return [];

  const inBuilding = users.filter((person) => person.buildingId === building.id).map((person) => person.id);
  const onFloor = users.filter((person) => person.floorId === floor.id).map((person) => person.id);

  return [
    {
      id: "neighborhood:fantoft",
      kind: "neighborhood",
      name: "Fantoft",
      blurb: "Alle blokkene i studentbyen",
      memberIds: users.map((person) => person.id),
    },
    {
      id: `building:${building.id}`,
      kind: "building",
      name: building.name,
      blurb: building.complex,
      memberIds: inBuilding,
    },
    {
      id: `floor:${floor.id}`,
      kind: "floor",
      name: floor.name,
      blurb: `${floor.name} i ${building.name.toLowerCase()}`,
      memberIds: onFloor,
    },
  ];
}

export function spaceById(viewer: User, id: string): Space | undefined {
  const fixed = spacesFor(viewer).find((space) => space.id === id);
  if (fixed) return fixed;
  const other = otherInDm(id, viewer.id);
  if (!other) return undefined;
  return dmSpace(viewer, other);
}

export const seedOpenedDmIds = ["dm:emma:jonas", "dm:emma:sara"];

export const seedPosts: Post[] = [
  {
    id: "p1",
    spaceId: "neighborhood:fantoft",
    authorId: "jonas",
    pinned: true,
    createdAt: "2026-10-14T08:05:00",
    likedBy: ["emma", "sara", "malik"],
    comments: [
      {
        id: "c1",
        authorId: "sara",
        createdAt: "2026-10-14T08:40:00",
        body: "Vi kommer fra blokk B. Er det plass nok i klubben?",
      },
    ],
    body: "Tillitsutvalget holder quiz på Klubb Fantoft torsdag klokken 19:00. Lørdag er det silent disco samme sted. Åpent for alle blokker. Hverdager til 23, fredag og lørdag til midnatt.",
  },
  {
    id: "p2",
    spaceId: "neighborhood:fantoft",
    authorId: "malik",
    pinned: true,
    createdAt: "2026-10-13T16:10:00",
    likedBy: ["emma", "jonas"],
    comments: [],
    body: "Vaskeri: bor du i blokk R eller S, bruk vaskeriet i blokk R. Alle andre bruker blokk C. Betaling og maskinvalg skjer i appWash. Husk å fornye sykkeloblatet. Stallen ligger under N-bygget.",
  },
  {
    id: "p3",
    spaceId: "neighborhood:fantoft",
    authorId: "emma",
    createdAt: "2026-10-13T18:20:00",
    likedBy: ["sara"],
    comments: [
      {
        id: "c2",
        authorId: "jonas",
        createdAt: "2026-10-13T18:46:00",
        body: "Jeg booket en time søndag. Det sto gitarer der sist jeg var innom.",
      },
    ],
    body: "Musikkrommet under M-blokken kan bookes mellom 09 og 21, maks to timer og to ganger i uken. Tagen må registreres på servicesenteret første gang.",
  },
  {
    id: "p4",
    spaceId: "neighborhood:fantoft",
    authorId: "sara",
    createdAt: "2026-10-12T11:40:00",
    likedBy: ["malik"],
    comments: [],
    body: "Parkeringen er full dette semesteret. Gjenbruksrommene er åpne hvis du skal kvitte deg med noe, eller trenger en lampe. Restavfall, plast og papp kastes i nedkastene ved bybanestoppet.",
  },
  {
    id: "p5",
    spaceId: "building:f",
    authorId: "emma",
    pinned: true,
    createdAt: "2026-10-14T09:00:00",
    likedBy: ["jonas"],
    comments: [],
    body: "Fellesrommet i 1. etasje i blokk F har TV, sofaer og lesesal innerst. Det er for hele Langblokken. Hold det ryddig. Åpent 08–23, fredag og lørdag til midnatt.",
  },
  {
    id: "p6",
    spaceId: "building:f",
    authorId: "jonas",
    createdAt: "2026-10-13T15:20:00",
    likedBy: [],
    comments: [
      {
        id: "c3",
        authorId: "emma",
        createdAt: "2026-10-13T15:35:00",
        body: "Jeg tok trappen. Den stoppet mellom 4 og 5 på vei ned.",
      },
    ],
    body: "Heisen i blokk F har vært treg i ettermiddag. Bruk trappen hvis du kan. Vaktmester er varslet.",
  },
  {
    id: "p7",
    spaceId: "floor:f-3",
    authorId: "jonas",
    pinned: true,
    createdAt: "2026-10-14T09:15:00",
    likedBy: ["emma"],
    comments: [
      {
        id: "c4",
        authorId: "emma",
        createdAt: "2026-10-14T09:28:00",
        body: "Jeg tar med sopp. Ses på kjøkkenet.",
      },
    ],
    body: "Etasjemiddag søndag klokken 18:00 på kjøkkenet i etasje 3. Jeg kjøper deig. Ta med ett pålegg og din egen tallerken.",
  },
  {
    id: "p8",
    spaceId: "floor:f-3",
    authorId: "emma",
    createdAt: "2026-10-13T21:05:00",
    likedBy: [],
    comments: [],
    body: "Lyset i gangen utenfor F312 blinker. Jeg meldte det til boligkontoret i morges.",
  },
  {
    id: "p9",
    spaceId: "building:b",
    authorId: "sara",
    pinned: true,
    createdAt: "2026-10-12T17:00:00",
    likedBy: [],
    comments: [],
    body: "Fellesrommet ved lesesalen i blokk B har TV og sofaer. Det er to lesesaler for A og B. De fylles opp etter sju, så kom tidlig hvis du skal lese der.",
  },
  {
    id: "p10",
    spaceId: "floor:b-2",
    authorId: "sara",
    pinned: true,
    createdAt: "2026-10-11T19:12:00",
    likedBy: [],
    comments: [],
    body: "Kjøkkenet i etasje 2 tørker fortsatt etter lekkasjen. Ikke sett noe på benken mot ytterveggen før det er tørt.",
  },
  {
    id: "p11",
    spaceId: "building:r",
    authorId: "malik",
    pinned: true,
    createdAt: "2026-10-13T12:00:00",
    likedBy: [],
    comments: [],
    body: "Takterrassen og fellesrommet innenfor er for blokk R og S. Der er det TV, kjøkken og sofaer. Postkassene til R står i S-blokken. Vaskeriet i R er bare for oss.",
  },
  {
    id: "p12",
    spaceId: "floor:r-5",
    authorId: "malik",
    createdAt: "2026-10-12T20:15:00",
    likedBy: [],
    comments: [],
    body: "Fjernkontrollen til TV-en i kjøkkenet på etasje 5 ligger i skuffen under vannkokeren. Legg den tilbake der.",
  },
];

export const seedMessages: Message[] = [
  {
    id: "m1",
    spaceId: "neighborhood:fantoft",
    authorId: "sara",
    createdAt: "2026-10-14T10:02:00",
    body: "Er Klubb Fantoft åpen etter quizen, eller stenger dere med en gang?",
  },
  {
    id: "m2",
    spaceId: "neighborhood:fantoft",
    authorId: "jonas",
    createdAt: "2026-10-14T10:06:00",
    body: "Den er åpen til 23. Vi kommer fra blokk F og tar med et brettspill.",
  },
  {
    id: "m3",
    spaceId: "neighborhood:fantoft",
    authorId: "malik",
    createdAt: "2026-10-14T10:11:00",
    body: "Vi går ned fra blokk R rundt halv åtte. Er det biljardbordet som er ledig, eller er det booket?",
  },
  {
    id: "m4",
    spaceId: "neighborhood:fantoft",
    authorId: "emma",
    createdAt: "2026-10-14T10:18:00",
    body: "Ikke booket. Kom når dere kan. Det er lesesal ved inngangen hvis noen heller vil sitte stille.",
  },
  {
    id: "m5",
    spaceId: "building:f",
    authorId: "jonas",
    createdAt: "2026-10-14T11:24:00",
    body: "Noen som har sett nøkkelen til boden i første etasje? Den hang ikke på kroken.",
  },
  {
    id: "m6",
    spaceId: "building:f",
    authorId: "emma",
    createdAt: "2026-10-14T11:31:00",
    body: "Jeg så den på bordet i fellesrommet i sted. Den skal tilbake på kroken.",
  },
  {
    id: "m7",
    spaceId: "floor:f-3",
    authorId: "jonas",
    createdAt: "2026-10-14T11:40:00",
    body: "Pakken til F314 ligger på kjøkkenbenken.",
  },
  {
    id: "m8",
    spaceId: "floor:f-3",
    authorId: "emma",
    createdAt: "2026-10-14T11:46:00",
    body: "Den er min. Takk, jeg henter den etter forelesningen.",
  },
  {
    id: "m9",
    spaceId: "building:b",
    authorId: "sara",
    createdAt: "2026-10-14T09:05:00",
    body: "Lesesalen i B er full nå. Det er en ledig plass innerst hvis noen er på vei.",
  },
  {
    id: "m10",
    spaceId: "floor:b-2",
    authorId: "sara",
    createdAt: "2026-10-14T08:20:00",
    body: "Jeg lufter kjøkkenet en time i formiddag. Sett gjerne opp vinduet igjen hvis det blir kaldt.",
  },
  {
    id: "m11",
    spaceId: "building:r",
    authorId: "malik",
    createdAt: "2026-10-14T09:46:00",
    body: "Det blåser på takterrassen i dag. Døren inn til fellesrommet slår igjen hvis den ikke hektes.",
  },
  {
    id: "m12",
    spaceId: "floor:r-5",
    authorId: "malik",
    createdAt: "2026-10-14T08:55:00",
    body: "Jeg setter på kaffe på kjøkkenet hvis noen i etasjen vil ha før ni.",
  },
  {
    id: "m13",
    spaceId: "dm:emma:jonas",
    authorId: "jonas",
    createdAt: "2026-10-13T22:12:00",
    body: "La laderen din på hylla på kjøkkenet i etasje 3.",
  },
  {
    id: "m14",
    spaceId: "dm:emma:jonas",
    authorId: "emma",
    createdAt: "2026-10-13T22:16:00",
    body: "Takk. Jeg holder på å lete gjennom hele kvelden.",
  },
  {
    id: "m15",
    spaceId: "dm:emma:sara",
    authorId: "sara",
    createdAt: "2026-10-12T19:04:00",
    body: "Skal du på quizen, eller blir dere i Langblokken?",
  },
  {
    id: "m16",
    spaceId: "dm:emma:sara",
    authorId: "emma",
    createdAt: "2026-10-12T19:11:00",
    body: "Vi kommer. Jeg møter deg ved inngangen til klubben kvart på sju.",
  },
];
