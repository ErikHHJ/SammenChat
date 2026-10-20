import { useState } from "react";
import type { FormEvent } from "react";
import { buildingLabel, PASSWORD, users } from "./data";
import { avatarColor } from "./format";

type LoginScreenProps = {
  onLogin: (email: string, password: string) => boolean;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("emma@sammen.no");
  const [password, setPassword] = useState(PASSWORD);
  const [error, setError] = useState("");

  function submit(nextEmail: string, nextPassword: string) {
    const ok = onLogin(nextEmail, nextPassword);
    setError(ok ? "" : "Feil e-post eller passord.");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submit(email, password);
  }

  return (
    <div className="login">
      <section className="login-brand">
        <div className="login-stack">
        <div className="brand-mark">S</div>
        <p className="eyebrow">Studentbolig</p>
        <h1>Sammen</h1>
        <p className="lede">
          Ett sted for dem du bor sammen med. Hele Fantoft, blokken din, etasjen din, og en privat samtale med én annen beboer.
        </p>
        <ul className="brand-points">
          <li>
            <strong>Tavle</strong>
            <span>Oppslag for studentbyen, blokken og etasjen. Annonser på Fantoft kommer fra arrangører. I blokken kan du legge ut et arrangement.</span>
          </li>
          <li>
            <strong>Chat</strong>
            <span>Samtalen som skjer nå, adskilt fra tavlen.</span>
          </li>
          <li>
            <strong>Direktemeldinger</strong>
            <span>Søk opp et navn og skriv privat med den personen.</span>
          </li>
        </ul>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-stack">
        <h2>Logg inn</h2>
        <p className="panel-copy">
          Passordet er <code>sammen</code>.
        </p>
        <form onSubmit={onSubmit}>
          <label>
            E-post
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Passord
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary" type="submit">
            Gå inn
          </button>
        </form>
        <div className="account-list">
          <p>Eller velg en beboer</p>
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              className="account"
              onClick={() => {
                setEmail(user.email);
                setPassword(user.password);
                submit(user.email, user.password);
              }}
            >
              <span className="avatar" style={{ background: avatarColor(user.id) }}>
                {user.name.slice(0, 1)}
              </span>
              <span>
                <strong>{user.name}</strong>
                <small>
                  {buildingLabel(user.buildingId)} · etasje {user.floorId.split("-").at(-1)} · {user.program}
                </small>
              </span>
            </button>
          ))}
        </div>
        </div>
      </section>
    </div>
  );
}
