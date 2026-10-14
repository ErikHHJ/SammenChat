import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { buildingLabel, dmId, findUser, otherInDm, spaceById, spacesFor, users } from "./data";
import { avatarColor, formatStamp, initials } from "./format";
import { loadState, resetState, saveState } from "./storage";
import type { AppState, Comment, Message, Post, Space, SpaceKind, User } from "./types";

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
  const [announce, setAnnounce] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [query, setQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const space = spaceById(user, spaceId) ?? fixedSpaces[0];
  const posts = state.posts;
  const messages = state.messages;

  const spacePosts = posts
    .filter((post) => post.spaceId === space?.id)
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.createdAt.localeCompare(a.createdAt));

  const spaceMessages = messages
    .filter((message) => message.spaceId === space?.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const dmSpaces = state.openedDmIds
    .map((id) => spaceById(user, id))
    .filter((item): item is Space => item?.kind === "dm" && item.memberIds.includes(user.id));

  const matches = users.filter((person) => {
    const needle = query.trim().toLowerCase();
    return needle.length > 0 && person.id !== user.id && person.name.toLowerCase().includes(needle);
  });

  useEffect(() => {
    if (space?.kind === "dm" || tab === "chat") {
      const node = threadRef.current;
      if (node) node.scrollTop = node.scrollHeight;
    }
  }, [tab, space?.id, space?.kind, spaceMessages.length]);

  if (!space) return null;

  function persist(next: AppState) {
    setState(next);
    saveState(next);
  }

  function openSpace(id: string, nextKind?: SpaceKind) {
    setShowProfile(false);
    setSpaceId(id);
    setDraftPost("");
    setDraftMessage("");
    setAnnounce(false);
    if (nextKind === "dm") setTab("chat");
  }

  function openPerson(other: User) {
    const id = dmId(user.id, other.id);
    const openedDmIds = state.openedDmIds.includes(id) ? state.openedDmIds : [id, ...state.openedDmIds];
    persist({ ...state, openedDmIds });
    setQuery("");
    openSpace(id, "dm");
  }

  function publishPost(event: FormEvent) {
    event.preventDefault();
    const body = draftPost.trim();
    if (!body || space.kind === "dm") return;
    const post: Post = {
      id: crypto.randomUUID(),
      spaceId: space.id,
      authorId: user.id,
      body,
      createdAt: new Date().toISOString(),
      pinned: announce || undefined,
      likedBy: [],
      comments: [],
    };
    persist({ ...state, posts: [post, ...posts] });
    setDraftPost("");
    setAnnounce(false);
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

  function toggleLike(postId: string) {
    const nextPosts = posts.map((post) => {
      if (post.id !== postId) return post;
      const liked = post.likedBy.includes(user.id);
      return {
        ...post,
        likedBy: liked ? post.likedBy.filter((id) => id !== user.id) : [...post.likedBy, user.id],
      };
    });
    persist({ ...state, posts: nextPosts });
  }

  function addComment(postId: string, body: string) {
    const comment: Comment = {
      id: crypto.randomUUID(),
      authorId: user.id,
      body,
      createdAt: new Date().toISOString(),
    };
    const nextPosts = posts.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, comment] } : post));
    persist({ ...state, posts: nextPosts });
  }

  function resetContent() {
    const confirmed = window.confirm("Vil du legge tilbake de opprinnelige innleggene og meldingene?");
    if (!confirmed) return;
    const fresh = resetState();
    setState(fresh);
    setShowProfile(false);
    setSpaceId(fixedSpaces[0]?.id ?? "");
    setTab("board");
  }

  const showBoard = space.kind !== "dm";
  const activeSpaceId = showProfile ? "" : space.id;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="side-brand">
          <span className="brand-mark small">S</span>
          <div>
            <strong>Sammen</strong>
            <small>Fantoft</small>
          </div>
        </div>

        <button type="button" className={showProfile ? "me active" : "me"} onClick={() => setShowProfile(true)}>
          <Avatar user={user} />
          <div>
            <strong>{user.name}</strong>
            <small>
              Rom {user.room} · {user.program}
            </small>
          </div>
        </button>

        <SpaceList title="Fellesskap" spaces={fixedSpaces.filter((item) => item.kind === "neighborhood")} activeId={activeSpaceId} onPick={(id) => openSpace(id, "neighborhood")} />
        <SpaceList title="Bygg" spaces={fixedSpaces.filter((item) => item.kind === "building")} activeId={activeSpaceId} onPick={(id) => openSpace(id, "building")} />
        <SpaceList title="Etasje" spaces={fixedSpaces.filter((item) => item.kind === "floor")} activeId={activeSpaceId} onPick={(id) => openSpace(id, "floor")} />

        <nav className="space-list" aria-label="Meldinger">
          <p>Meldinger</p>
          <label className="person-search">
            <span className="sr-only">Søk etter navn</span>
            <input value={query} placeholder="Søk etter navn" onChange={(event) => setQuery(event.target.value)} />
          </label>
          {query.trim() ? (
            matches.length === 0 ? (
              <p className="search-empty">Ingen treff</p>
            ) : (
              matches.map((person) => (
                <button key={person.id} type="button" className="space" onClick={() => openPerson(person)}>
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
              <button key={item.id} type="button" className={item.id === activeSpaceId ? "space active" : "space"} onClick={() => openSpace(item.id, "dm")}>
                {person ? <Avatar user={person} small /> : <KindMark kind="dm" />}
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
        {showProfile ? (
          <ProfilePage
            user={user}
            posts={posts.filter((post) => post.authorId === user.id)}
            onOpenSpace={(id) => {
              setTab("board");
              const kind = id.startsWith("floor:") ? "floor" : id.startsWith("building:") ? "building" : "neighborhood";
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
                  return <Avatar key={id} user={person} small title={person.name} />;
                })}
                <span>{peopleLabel(space.memberIds.length)}</span>
              </div>
            )}
          </div>
          {showBoard ? (
            <div className="tabs" role="tablist" aria-label="Tavle og chat">
              <button type="button" role="tab" aria-selected={tab === "board"} className={tab === "board" ? "active" : ""} onClick={() => setTab("board")}>
                Tavle
              </button>
              <button type="button" role="tab" aria-selected={tab === "chat"} className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>
                Chat
              </button>
            </div>
          ) : null}
        </header>

        {showBoard && tab === "board" ? (
          <section className="panel" role="tabpanel">
            <form className="composer" onSubmit={publishPost}>
              <Avatar user={user} />
              <div className="composer-fields">
                <label className="sr-only" htmlFor="post-body">
                  Skriv et innlegg
                </label>
                <textarea
                  id="post-body"
                  rows={3}
                  placeholder="Skriv et innlegg til tavlen"
                  value={draftPost}
                  onChange={(event) => setDraftPost(event.target.value)}
                />
                <div className="composer-bar">
                  <label className="check">
                    <input type="checkbox" checked={announce} onChange={(event) => setAnnounce(event.target.checked)} />
                    Merk som oppslag
                  </label>
                  <button className="primary" type="submit" disabled={!draftPost.trim()}>
                    Publiser
                  </button>
                </div>
              </div>
            </form>

            {spacePosts.length === 0 ? (
              <div className="empty">
                <h2>Tavlen er tom</h2>
                <p>Legg ut et oppslag eller et innlegg. Chatten er til det som skjer akkurat nå.</p>
              </div>
            ) : (
              <div className="feed">
                {spacePosts.map((post) => (
                  <PostCard key={post.id} post={post} viewerId={user.id} onLike={() => toggleLike(post.id)} onComment={(body) => addComment(post.id, body)} />
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
                  <p>{space.kind === "dm" ? `Skriv til ${space.name}.` : "Chatten er adskilt fra tavlen."}</p>
                </div>
              ) : (
                spaceMessages.map((message) => <ChatLine key={message.id} message={message} viewerId={user.id} />)
              )}
            </div>
            <form className="chat-composer" onSubmit={sendMessage}>
              <label className="sr-only" htmlFor="chat-body">
                Skriv en melding
              </label>
              <input
                id="chat-body"
                value={draftMessage}
                placeholder={space.kind === "dm" ? `Melding til ${space.name}` : `Melding til ${space.name}`}
                onChange={(event) => setDraftMessage(event.target.value)}
              />
              <button className="primary" type="submit" disabled={!draftMessage.trim()}>
                Send
              </button>
            </form>
          </section>
        )}
          </>
        )}
      </main>
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
  if (spaceId.startsWith("floor:")) return floorTitle(spaceId.slice("floor:".length));
  if (spaceId.startsWith("building:")) return buildingLabel(spaceId.slice("building:".length));
  if (spaceId.startsWith("neighborhood:")) return "Fantoft";
  return "Samtale";
}

function ProfilePage({ user, posts, onOpenSpace }: { user: User; posts: Post[]; onOpenSpace: (spaceId: string) => void }) {
  const ownPosts = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
        <p className="profile-empty">Du har ikke lagt ut noe på tavlene ennå.</p>
      ) : (
        <div className="feed">
          {ownPosts.map((post) => (
            <button key={post.id} type="button" className="own-post" onClick={() => onOpenSpace(post.spaceId)}>
              <small>
                {postPlace(post.spaceId)} · {formatStamp(post.createdAt)}
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
        <button key={item.id} type="button" className={item.id === activeId ? "space active" : "space"} onClick={() => onPick(item.id)}>
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
  const letter = kind === "neighborhood" ? "F" : kind === "building" ? (name?.replace("Blokk ", "") ?? "B") : kind === "floor" ? "E" : "M";
  return <span className={`kind-mark ${kind}`}>{letter}</span>;
}

function Avatar({ user, small, large, title }: { user: User; small?: boolean; large?: boolean; title?: string }) {
  const size = large ? "avatar large" : small ? "avatar small" : "avatar";
  return (
    <span className={size} style={{ background: avatarColor(user.id) }} title={title ?? user.name}>
      {initials(user.name)}
    </span>
  );
}

function PostCard({
  post,
  viewerId,
  onLike,
  onComment,
}: {
  post: Post;
  viewerId: string;
  onLike: () => void;
  onComment: (body: string) => void;
}) {
  const author = findUser(post.authorId);
  const liked = post.likedBy.includes(viewerId);
  const [draft, setDraft] = useState("");

  function submitComment(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onComment(body);
    setDraft("");
  }

  return (
    <article className={post.pinned ? "post pinned" : "post"}>
      <header>
        {author ? <Avatar user={author} /> : <span className="avatar">?</span>}
        <div>
          <strong>
            {author?.name ?? "Tidligere beboer"}
            {post.authorId === viewerId ? <em>Deg</em> : null}
          </strong>
          <small>
            {author ? `${author.program} · rom ${author.room}` : "Flyttet ut"} · {formatStamp(post.createdAt)}
          </small>
        </div>
        {post.pinned ? <span className="pin">Oppslag</span> : null}
      </header>
      <p>{post.body}</p>
      <div className="post-actions">
        <button type="button" className={liked ? "like on" : "like"} onClick={onLike}>
          {liked ? "Likt" : "Lik"}
          {post.likedBy.length > 0 ? ` · ${post.likedBy.length}` : ""}
        </button>
        <span className="comment-count">{commentLabel(post.comments.length)}</span>
      </div>
      {post.comments.length > 0 ? (
        <ul className="comments">
          {post.comments.map((comment) => {
            const person = findUser(comment.authorId);
            return (
              <li key={comment.id} className="comment">
                {person ? <Avatar user={person} small /> : <span className="avatar small">?</span>}
                <div>
                  <strong>
                    {person?.name ?? "Tidligere beboer"}
                    {comment.authorId === viewerId ? <em>Deg</em> : null}
                  </strong>
                  <p>{comment.body}</p>
                  <time>{formatStamp(comment.createdAt)}</time>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      <form className="comment-form" onSubmit={submitComment}>
        <label className="sr-only" htmlFor={`comment-${post.id}`}>
          Skriv en kommentar
        </label>
        <input
          id={`comment-${post.id}`}
          value={draft}
          placeholder="Skriv en kommentar"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className="primary" type="submit" disabled={!draft.trim()}>
          Kommenter
        </button>
      </form>
    </article>
  );
}

function commentLabel(count: number): string {
  if (count === 1) return "1 kommentar";
  return `${count} kommentarer`;
}

function ChatLine({ message, viewerId }: { message: Message; viewerId: string }) {
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
