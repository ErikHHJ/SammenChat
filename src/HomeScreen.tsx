import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  buildingLabel,
  dmId,
  findUser,
  otherInDm,
  spaceById,
  spacesFor,
  users,
} from "./data";
import { avatarColor, formatStamp, initials } from "./format";
import { loadState, resetState, saveState } from "./storage";
import type {
  AppState,
  Message,
  Post,
  PostKind,
  Space,
  SpaceKind,
  User,
} from "./types";

const kindLabel: Record<SpaceKind, string> = {
  neighborhood: "Fellesskap",
  building: "Bygg",
  floor: "Etasje",
  dm: "Direktemelding",
};

type HomeScreenProps = {
  user: User;
  onLogout: () => void;
};

export function HomeScreen({ user, onLogout }: HomeScreenProps) {
  const fixedSpaces = useMemo(() => spacesFor(user), [user]);
  const [state, setState] = useState<AppState>(() => loadState());
  const [spaceId, setSpaceId] = useState(fixedSpaces[0]?.id ?? "");
  const [tab, setTab] = useState<"board" | "chat">("board");
  const [draftPost, setDraftPost] = useState("");
  const [postKind, setPostKind] = useState<PostKind>("post");
  const [draftMessage, setDraftMessage] = useState("");
  const [query, setQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const space = spaceById(user, spaceId) ?? fixedSpaces[0];
  const posts = state.posts;
  const messages = state.messages;

  const spacePosts = posts
    .filter(
      (post) =>
        post.spaceId === space?.id &&
        (space?.kind !== "neighborhood" || post.ad),
    )
    .sort(
      (a, b) =>
        Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
        b.createdAt.localeCompare(a.createdAt),
    );

  const spaceMessages = messages
    .filter((message) => message.spaceId === space?.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const dmSpaces = state.openedDmIds
    .map((id) => spaceById(user, id))
    .filter(
      (item): item is Space =>
        item?.kind === "dm" && item.memberIds.includes(user.id),
    );

  const matches = users.filter((person) => {
    const needle = query.trim().toLowerCase();
    return (
      needle.length > 0 &&
      person.id !== user.id &&
      person.name.toLowerCase().includes(needle)
    );
  });

  useEffect(() => {
    if (space?.kind === "dm" || tab === "chat") {
      const node = threadRef.current;
      if (node) node.scrollTop = node.scrollHeight;
    }
  }, [tab, space?.id, space?.kind, spaceMessages.length]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const apply = () => setNarrow(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const node = navRef.current;
    if (!node) return;
    if (narrow && !navOpen) node.setAttribute("inert", "");
    else node.removeAttribute("inert");
  }, [narrow, navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  if (!space) return null;

  function persist(next: AppState) {
    setState(next);
    saveState(next);
  }

  function openSpace(id: string, nextKind?: SpaceKind) {
    setShowProfile(false);
    setNavOpen(false);
    setSpaceId(id);
    setDraftPost("");
    setDraftMessage("");
    setPostKind("post");
    if (nextKind === "dm") setTab("chat");
  }

  function openPerson(other: User) {
    const id = dmId(user.id, other.id);
    const openedDmIds = state.openedDmIds.includes(id)
      ? state.openedDmIds
      : [id, ...state.openedDmIds];
    persist({ ...state, openedDmIds });
    setQuery("");
    openSpace(id, "dm");
  }

  function publishPost(formEvent: FormEvent) {
    formEvent.preventDefault();
    const body = draftPost.trim();
    if (!body || space.kind === "dm" || space.kind === "neighborhood") return;
    const asEvent = space.kind === "building" && postKind === "event";
    const post: Post = {
      id: crypto.randomUUID(),
      spaceId: space.id,
      authorId: user.id,
      body,
      createdAt: new Date().toISOString(),
      pinned: postKind === "announcement" || undefined,
      event: asEvent || undefined,
      going: [],
    };
    persist({ ...state, posts: [post, ...posts] });
    setDraftPost("");
    setPostKind("post");
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const body = draftMessage.trim();
    if (!body) return;
    const message: Message = {
      id: crypto.randomUUID(),
      spaceId: space.id,
      authorId: user.id,
      body,
      createdAt: new Date().toISOString(),
    };
    persist({ ...state, messages: [...messages, message] });
    setDraftMessage("");
  }

  function toggleGoing(postId: string) {
    const nextPosts = posts.map((post) => {
      if (post.id !== postId) return post;
      const going = post.going.includes(user.id)
        ? post.going.filter((id) => id !== user.id)
        : [...post.going, user.id];
      return { ...post, going };
    });
    persist({ ...state, posts: nextPosts });
  }

  function resetContent() {
    const confirmed = window.confirm(
      "Vil du legge tilbake de opprinnelige innleggene og meldingene?",
    );
    if (!confirmed) return;
    const fresh = resetState();
    setState(fresh);
    setShowProfile(false);
    setSpaceId(fixedSpaces[0]?.id ?? "");
    setTab("board");
  }

  const showBoard = space.kind !== "dm";
  const canPostEvent = space.kind === "building";
  const activeSpaceId = showProfile ? "" : space.id;

  function openFixed(kind: SpaceKind) {
    const target = fixedSpaces.find((item) => item.kind === kind);
    if (target) openSpace(target.id, kind);
  }

  return (
    <div className={navOpen ? "app nav-open" : "app"}>
      <button
        type="button"
        className="nav-backdrop"
        aria-label="Lukk meny"
        onClick={() => setNavOpen(false)}
      />
      <aside
        className="sidebar"
        id="app-nav"
        ref={navRef}
        aria-hidden={narrow && !navOpen ? true : undefined}
      >
        <div className="side-brand">
          <span className="brand-mark small">S</span>
          <div>
            <strong>Sammen</strong>
            <small>Fantoft</small>
          </div>
          <button
            type="button"
            className="nav-close"
            onClick={() => setNavOpen(false)}
          >
            Lukk
          </button>
        </div>

        <button
          type="button"
          className={showProfile ? "me active" : "me"}
          onClick={() => {
            setShowProfile(true);
            setNavOpen(false);
          }}
        >
          <Avatar user={user} />
          <div>
            <strong>{user.name}</strong>
            <small>
              Rom {user.room} · {user.program}
            </small>
          </div>
        </button>

        <SpaceList
          title="Fellesskap"
          spaces={fixedSpaces.filter((item) => item.kind === "neighborhood")}
          activeId={activeSpaceId}
          onPick={(id) => openSpace(id, "neighborhood")}
        />
        <SpaceList
          title="Bygg"
          spaces={fixedSpaces.filter((item) => item.kind === "building")}
          activeId={activeSpaceId}
          onPick={(id) => openSpace(id, "building")}
        />
        <SpaceList
          title="Etasje"
          spaces={fixedSpaces.filter((item) => item.kind === "floor")}
          activeId={activeSpaceId}
          onPick={(id) => openSpace(id, "floor")}
        />

        <nav className="space-list" aria-label="Meldinger">
          <p>Meldinger</p>
          <label className="person-search">
            <span className="sr-only">Søk etter navn</span>
            <input
              value={query}
              placeholder="Søk etter navn"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {query.trim() ? (
            matches.length === 0 ? (
              <p className="search-empty">Ingen treff</p>
            ) : (
              matches.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="space"
                  onClick={() => openPerson(person)}
                >
                  <Avatar user={person} small />
                  <span>
                    <strong>{person.name}</strong>
                    <small>
                      Rom {person.room} · {person.program}
                    </small>
                  </span>
                </button>
              ))
            )
          ) : null}
          {dmSpaces.map((item) => {
            const person = otherInDm(item.id, user.id);
            return (
              <button
                key={item.id}
                type="button"
                className={item.id === activeSpaceId ? "space active" : "space"}
                onClick={() => openSpace(item.id, "dm")}
              >
                {person ? (
                  <Avatar user={person} small />
                ) : (
                  <KindMark kind="dm" />
                )}
                <span>
                  <strong>{item.name}</strong>
                  <small>{person?.program}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="side-actions">
          <button type="button" onClick={resetContent}>
            Nullstill
          </button>
          <button type="button" onClick={onLogout}>
            Logg ut
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="mobile-bar">
          <button
            type="button"
            className="menu-button"
            aria-expanded={navOpen}
            aria-controls="app-nav"
            onClick={() => setNavOpen(true)}
          >
            <span className="menu-icon" aria-hidden="true" />
            Meny
          </button>
        </div>
        {showProfile ? (
          <ProfilePage
            user={user}
            posts={posts.filter((post) => post.authorId === user.id)}
            onOpenSpace={(id) => {
              setTab("board");
              const kind = id.startsWith("floor:")
                ? "floor"
                : id.startsWith("building:")
                  ? "building"
                  : "neighborhood";
              openSpace(id, kind);
            }}
          />
        ) : (
          <>
            <header className="space-head">
              <div>
                <p className="eyebrow">{kindLabel[space.kind]}</p>
                <h1>{space.name}</h1>
                <p className="space-blurb">{space.blurb}</p>
                {space.kind === "dm" ? null : (
                  <div className="member-row">
                    {space.memberIds.map((id) => {
                      const person = findUser(id);
                      if (!person) return null;
                      return (
                        <Avatar
                          key={id}
                          user={person}
                          small
                          title={person.name}
                        />
                      );
                    })}
                    <span>{peopleLabel(space.memberIds.length)}</span>
                  </div>
                )}
              </div>
              {showBoard ? (
                <div className="tabs" role="tablist" aria-label="Tavle og chat">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "board"}
                    className={tab === "board" ? "active" : ""}
                    onClick={() => setTab("board")}
                  >
                    Tavle
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "chat"}
                    className={tab === "chat" ? "active" : ""}
                    onClick={() => setTab("chat")}
                  >
                    Chat
                  </button>
                </div>
              ) : null}
            </header>

            {showBoard && tab === "board" ? (
              <section className="panel" role="tabpanel">
                {space.kind === "neighborhood" ? (
                  <p className="board-note">Kommende arrangementer</p>
                ) : (
                  <form className="composer" onSubmit={publishPost}>
                    <Avatar user={user} />
                    <div className="composer-fields">
                      <label className="sr-only" htmlFor="post-body">
                        Skriv et innlegg
                      </label>
                      <textarea
                        id="post-body"
                        rows={3}
                        placeholder={
                          canPostEvent && postKind === "event"
                            ? "Skriv om arrangementet"
                            : "Skriv et innlegg til tavlen"
                        }
                        value={draftPost}
                        onChange={(event) => setDraftPost(event.target.value)}
                      />
                      <div className="composer-bar">
                        <div
                          className="kind-filter"
                          role="radiogroup"
                          aria-label="Type innlegg"
                        >
                          <KindOption
                            value="post"
                            current={postKind}
                            onPick={setPostKind}
                          >
                            Innlegg
                          </KindOption>
                          <KindOption
                            value="announcement"
                            current={postKind}
                            onPick={setPostKind}
                          >
                            Oppslag
                          </KindOption>
                          {canPostEvent ? (
                            <KindOption
                              value="event"
                              current={postKind}
                              onPick={setPostKind}
                            >
                              Arrangement
                            </KindOption>
                          ) : null}
                        </div>
                        <button
                          className="primary"
                          type="submit"
                          disabled={!draftPost.trim()}
                        >
                          Publiser
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {spacePosts.length === 0 ? (
                  <div className="empty">
                    <h2>Tavlen er tom</h2>
                    <p>
                      Legg ut et oppslag eller et innlegg. Chatten er til det
                      som skjer akkurat nå.
                    </p>
                  </div>
                ) : (
                  <div className="feed">
                    {spacePosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        viewerId={user.id}
                        onToggleGoing={() => toggleGoing(post.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <section className="chat-layout" role="tabpanel">
                <div className="thread" ref={threadRef}>
                  {spaceMessages.length === 0 ? (
                    <div className="empty">
                      <h2>Ingen meldinger ennå</h2>
                      <p>
                        {space.kind === "dm"
                          ? `Skriv til ${space.name}.`
                          : "Chatten er adskilt fra tavlen."}
                      </p>
                    </div>
                  ) : (
                    spaceMessages.map((message) => (
                      <ChatLine
                        key={message.id}
                        message={message}
                        viewerId={user.id}
                      />
                    ))
                  )}
                </div>
                <form className="chat-composer" onSubmit={sendMessage}>
                  <label className="sr-only" htmlFor="chat-body">
                    Skriv en melding
                  </label>
                  <input
                    id="chat-body"
                    value={draftMessage}
                    placeholder={
                      space.kind === "dm"
                        ? `Melding til ${space.name}`
                        : `Melding til ${space.name}`
                    }
                    onChange={(event) => setDraftMessage(event.target.value)}
                  />
                  <button
                    className="primary"
                    type="submit"
                    disabled={!draftMessage.trim()}
                  >
                    Send
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </main>
      <nav className="bottom-nav" aria-label="Hovedmeny">
        <button
          type="button"
          className={
            !showProfile && space.kind === "neighborhood" ? "active" : ""
          }
          onClick={() => openFixed("neighborhood")}
        >
          <KindMark kind="neighborhood" />
          <span>Fantoft</span>
        </button>
        <button
          type="button"
          className={!showProfile && space.kind === "building" ? "active" : ""}
          onClick={() => openFixed("building")}
        >
          <KindMark
            kind="building"
            name={fixedSpaces.find((item) => item.kind === "building")?.name}
          />
          <span>Bygg</span>
        </button>
        <button
          type="button"
          className={!showProfile && space.kind === "floor" ? "active" : ""}
          onClick={() => openFixed("floor")}
        >
          <KindMark kind="floor" />
          <span>Etasje</span>
        </button>
        <button
          type="button"
          className={!showProfile && space.kind === "dm" ? "active" : ""}
          onClick={() => setNavOpen(true)}
        >
          <KindMark kind="dm" />
          <span>Meldinger</span>
        </button>
        <button
          type="button"
          className={showProfile ? "active" : ""}
          onClick={() => {
            setShowProfile(true);
            setNavOpen(false);
          }}
        >
          <Avatar user={user} small />
          <span>Profil</span>
        </button>
      </nav>
    </div>
  );
}

function peopleLabel(count: number): string {
  return count === 1 ? "1 person" : `${count} personer`;
}

function floorTitle(floorId: string): string {
  return `Etasje ${floorId.split("-").at(-1) ?? ""}`;
}

function postPlace(spaceId: string): string {
  if (spaceId.startsWith("floor:"))
    return floorTitle(spaceId.slice("floor:".length));
  if (spaceId.startsWith("building:"))
    return buildingLabel(spaceId.slice("building:".length));
  if (spaceId.startsWith("neighborhood:")) return "Fantoft";
  return "Samtale";
}

function ProfilePage({
  user,
  posts,
  onOpenSpace,
}: {
  user: User;
  posts: Post[];
  onOpenSpace: (spaceId: string) => void;
}) {
  const ownPosts = [...posts].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const floor = floorTitle(user.floorId);
  const building = buildingLabel(user.buildingId);

  return (
    <section className="panel profile">
      <div className="profile-card">
        <Avatar user={user} large />
        <div>
          <p className="eyebrow">Min profil</p>
          <h1>{user.name}</h1>
          <p>
            {building} · {floor} · rom {user.room}
          </p>
        </div>
      </div>
      <dl className="facts">
        <div>
          <dt>E-post</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Bygg</dt>
          <dd>{building}</dd>
        </div>
        <div>
          <dt>Boligområde</dt>
          <dd>Fantoft</dd>
        </div>
        <div>
          <dt>Etasje</dt>
          <dd>{floor}</dd>
        </div>
        <div>
          <dt>Rom</dt>
          <dd>{user.room}</dd>
        </div>
        <div>
          <dt>Studieprogram</dt>
          <dd>{user.program}</dd>
        </div>
      </dl>
      <h2>Dine innlegg</h2>
      {ownPosts.length === 0 ? (
        <p className="profile-empty">
          Du har ikke lagt ut noe på tavlene ennå.
        </p>
      ) : (
        <div className="feed">
          {ownPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              className="own-post"
              onClick={() => onOpenSpace(post.spaceId)}
            >
              <small>
                {postPlace(post.spaceId)} · {formatStamp(post.createdAt)}
                {post.event ? " · Arrangement" : ""}
              </small>
              <p>{post.body}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function SpaceList({
  title,
  spaces,
  activeId,
  onPick,
}: {
  title: string;
  spaces: Space[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <nav className="space-list" aria-label={title}>
      <p>{title}</p>
      {spaces.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === activeId ? "space active" : "space"}
          onClick={() => onPick(item.id)}
        >
          <KindMark kind={item.kind} name={item.name} />
          <span>
            <strong>{item.name}</strong>
            <small>{peopleLabel(item.memberIds.length)}</small>
          </span>
        </button>
      ))}
    </nav>
  );
}

function KindMark({ kind, name }: { kind: SpaceKind; name?: string }) {
  const letter =
    kind === "neighborhood"
      ? "F"
      : kind === "building"
        ? (name?.replace("Blokk ", "") ?? "B")
        : kind === "floor"
          ? "E"
          : "M";
  return <span className={`kind-mark ${kind}`}>{letter}</span>;
}

function Avatar({
  user,
  small,
  large,
  title,
}: {
  user: User;
  small?: boolean;
  large?: boolean;
  title?: string;
}) {
  const size = large ? "avatar large" : small ? "avatar small" : "avatar";
  return (
    <span
      className={size}
      style={{ background: avatarColor(user.id) }}
      title={title ?? user.name}
    >
      {initials(user.name)}
    </span>
  );
}

function KindOption({
  value,
  current,
  onPick,
  children,
}: {
  value: PostKind;
  current: PostKind;
  onPick: (value: PostKind) => void;
  children: string;
}) {
  const selected = value === current;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={selected ? "active" : ""}
      onClick={() => onPick(value)}
    >
      {children}
    </button>
  );
}

function PostText({ body }: { body: string }) {
  const parts = body.split(/(https?:\/\/[^\s]+)/g);
  return (
    <p>
      {parts.map((part, index) => {
        if (!part.startsWith("http://") && !part.startsWith("https://"))
          return <span key={index}>{part}</span>;
        const href = part.replace(/[.,)]+$/, "");
        const trailing = part.slice(href.length);
        return (
          <span key={index}>
            <a href={href} target="_blank" rel="noreferrer">
              {href}
            </a>
            {trailing}
          </span>
        );
      })}
    </p>
  );
}

function goingLabel(ids: string[], viewerId: string): string {
  const names = ids
    .map((id) => (id === viewerId ? "Du" : findUser(id)?.name.split(" ")[0]))
    .filter((name): name is string => Boolean(name));
  const ordered = names.includes("Du")
    ? ["Du", ...names.filter((name) => name !== "Du")]
    : names;
  if (ordered.length === 0) return "Ingen skal ennå";
  if (ordered.length === 1) return `${ordered[0]} skal`;
  return `${ordered.slice(0, -1).join(", ")} og ${ordered.at(-1)} skal`;
}

function PostCard({
  post,
  viewerId,
  onToggleGoing,
}: {
  post: Post;
  viewerId: string;
  onToggleGoing: () => void;
}) {
  const author = post.authorId ? findUser(post.authorId) : undefined;
  const going = post.going.includes(viewerId);
  const className = [
    "post",
    post.ad ? "ad" : "",
    post.pinned ? "pinned" : "",
    post.event && !post.ad ? "event" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={className}>
      <header>
        {post.ad ? (
          <span className="avatar org" style={{ background: post.ad.color }}>
            {post.ad.mark}
          </span>
        ) : author ? (
          <Avatar user={author} />
        ) : (
          <span className="avatar">?</span>
        )}
        <div>
          <strong>
            {post.ad?.name ?? author?.name ?? "Tidligere beboer"}
            {!post.ad && post.authorId === viewerId ? <em>Deg</em> : null}
          </strong>
          <small>
            {post.ad
              ? post.ad.detail
              : author
                ? `${author.program} · rom ${author.room}`
                : "Flyttet ut"}{" "}
            · {formatStamp(post.createdAt)}
          </small>
        </div>
        {post.ad ? (
          <span className="pin ad">Betalt plassering</span>
        ) : post.event ? (
          <span className="pin event">Arrangement</span>
        ) : post.pinned ? (
          <span className="pin">Oppslag</span>
        ) : null}
      </header>
      <PostText body={post.body} />
      {post.event ? (
        <div className="post-actions">
          <button
            type="button"
            className={going ? "skal on" : "skal"}
            aria-pressed={going}
            onClick={onToggleGoing}
          >
            Skal
          </button>
          <span className="going">{goingLabel(post.going, viewerId)}</span>
        </div>
      ) : null}
    </article>
  );
}

function ChatLine({
  message,
  viewerId,
}: {
  message: Message;
  viewerId: string;
}) {
  const author = findUser(message.authorId);
  const mine = message.authorId === viewerId;
  return (
    <div className={mine ? "line mine" : "line"}>
      {mine || !author ? null : <Avatar user={author} small />}
      <div>
        {mine ? null : <strong>{author?.name ?? "Tidligere beboer"}</strong>}
        <p>{message.body}</p>
        <time>{formatStamp(message.createdAt)}</time>
      </div>
    </div>
  );
}
