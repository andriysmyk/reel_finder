"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { ApiError, ShowSummary } from "@/lib/types";
import Marquee from "./Marquee";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string; status: number }
  | { kind: "done"; results: ShowSummary[] };

export default function SearchView() {
  const router = useRouter();
  const params = useSearchParams();
  const urlQuery = params.get("q") ?? "";

  const [input, setInput] = useState(urlQuery);
  const [state, setState] = useState<State>({ kind: "idle" });

  // The browser sends the request to our API; inspect it in DevTools → Network
  useEffect(() => {
    if (!urlQuery) {
      setState({ kind: "idle" });
      return;
    }
    const controller = new AbortController();
    setState({ kind: "loading" });

    fetch(`/api/search?q=${encodeURIComponent(urlQuery)}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({ error: "Unexpected response" }))) as ApiError;
          setState({ kind: "error", message: body.error, status: res.status });
          return;
        }
        const body = (await res.json()) as { results: ShowSummary[] };
        setState({ kind: "done", results: body.results });
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setState({ kind: "error", message: "Could not reach the server. Check your connection.", status: 0 });
      });

    return () => controller.abort();
  }, [urlQuery]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const q = input.trim();
    router.replace(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <>
      <Marquee subtitle="Search any TV show and open its details." />

      <form className="search" onSubmit={onSubmit} role="search">
        <label htmlFor="q" className="visually-hidden">Show title</label>
        <input
          id="q"
          className="search__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try “Sherlock” or “The Office”"
          autoComplete="off"
        />
        <button className="search__button" type="submit">Search</button>
      </form>

      <section aria-live="polite" className="results">
        {state.kind === "idle" && <p className="status">Type a title to see what’s showing.</p>}
        {state.kind === "loading" && <p className="status">Searching…</p>}
        {state.kind === "error" && (
          <p className="status status--error">
            {state.message}
            {state.status > 0 && <span className="status__code">HTTP {state.status}</span>}
          </p>
        )}
        {state.kind === "done" && state.results.length === 0 && (
          <p className="status">No shows match “{urlQuery}”. Check the spelling or try a shorter title.</p>
        )}
        {state.kind === "done" && state.results.length > 0 && (
          <ul className="tickets">
            {state.results.map((show) => (
              <li key={show.id}>
                <Link href={`/shows/${show.id}`} className="ticket">
                  <div className="ticket__poster">
                    {show.imageUrl ? <img src={show.imageUrl} alt="" loading="lazy" /> : <span>No poster</span>}
                  </div>
                  <div className="ticket__body">
                    <h2 className="ticket__title">{show.name}</h2>
                    <p className="ticket__meta">
                      {show.year ?? "Year unknown"}
                      {show.rating !== null && <> &nbsp;/&nbsp; ★ {show.rating}</>}
                    </p>
                    {show.genres.length > 0 && <p className="ticket__genres">{show.genres.join(", ")}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
