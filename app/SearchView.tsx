"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { ApiError, ShowSummary } from "@/lib/types";
import Marquee from "./Marquee";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; results: ShowSummary[] };
const featuredShows = [
  { id: 82, name: "Game of Thrones" },
  { id: 465, name: "Band of Brothers" },
  { id: 3594, name: "The Crown" },
  { id: 33352, name: "The Lord of the Rings: The Rings of Power" },
  { id: 527, name: "The Sopranos" },
  { id: 68803, name: "Harry Potter" },
  { id: 55352, name: "Clarkson's Farm" },
  { id: 431, name: "Friends" },
  { id: 43031, name: "Reacher" },
];
const suggestions = featuredShows.map((show) => show.name);

export default function SearchView() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const [input, setInput] = useState(query);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [retry, setRetry] = useState(0);

  useEffect(() => { setInput(query); }, [query]);
  useEffect(() => {
    const controller = new AbortController();
    setState({ kind: "loading" });
    async function load() {
      try {
        const urls = query
          ? [`/api/search?q=${encodeURIComponent(query)}`]
          : featuredShows.map((show) => `/api/shows/${show.id}`);
        const responses = await Promise.allSettled(urls.map(async (url) => {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Unexpected server response." })) as ApiError;
            throw new Error(error.error);
          }
          return response.json();
        }));
        const data = responses.flatMap((response) => response.status === "fulfilled" ? [response.value] : []);
        if (data.length === 0) {
          const failure = responses.find((response) => response.status === "rejected");
          throw failure?.status === "rejected" ? failure.reason : new Error("Could not load shows. Please try again.");
        }
        if (!controller.signal.aborted) setState({ kind: "done", results: query ? data[0].results : data });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({ kind: "error", message: error instanceof Error ? error.message : "Could not load shows. Please try again." });
      }
    }
    void load();
    return () => controller.abort();
  }, [query, retry]);

  function search(value: string) {
    const title = value.trim();
    setInput(title);
    if (title === query) setRetry((value) => value + 1);
    else router.replace(title ? `/?q=${encodeURIComponent(title)}` : "/", { scroll: false });
  }
  function submit(event: FormEvent) { event.preventDefault(); search(input); }

  return (
    <>
      <Marquee />
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__art" aria-hidden="true" />
        <div className="hero__content">
          <p className="eyebrow">A good story starts here</p>
          <h1 id="hero-title">Your next<br />great <span>watch.</span></h1>
          <p className="hero__subtitle">Discover TV shows. Find your next favourite.</p>
          <form id="search" className="search" onSubmit={submit} role="search">
            <label htmlFor="q" className="visually-hidden">Search TV show titles</label>
            <svg className="search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></svg>
            <input id="q" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search for TV shows…" autoComplete="off" />
            <button type="submit">Search <span aria-hidden="true">↗</span></button>
          </form>
          <div className="suggestions" aria-label="Quick searches">
            <span>Try a favourite</span>
            {suggestions.map((title) => <button key={title} type="button" onClick={() => search(title)} aria-pressed={query === title}>{title}</button>)}
          </div>
        </div>
      </section>
      <section id="results" className="results" aria-labelledby="results-title" aria-busy={state.kind === "loading"}>
        <div className="results__heading">
          <div><p className="eyebrow">{query ? "Find your story" : "Worth discovering"}</p><h2 id="results-title">{query ? "Search results" : "Stories worth watching"}</h2></div>
          <p className="results__count" role="status">{state.kind === "done" ? `${state.results.length} ${state.results.length === 1 ? "show" : "shows"}${query ? ` for “${query}”` : " to get you started"}` : state.kind === "loading" ? "Finding your next watch…" : ""}</p>
        </div>
        {state.kind === "loading" && <div className="show-grid" aria-hidden="true">{[0, 1, 2].map((id) => <div key={id} className="skeleton" />)}</div>}
        {state.kind === "error" && <div className="empty-state" role="alert"><h3>Something interrupted the story.</h3><p>{state.message}</p><button className="outline-button" onClick={() => setRetry((value) => value + 1)}>Try again</button></div>}
        {state.kind === "done" && state.results.length === 0 && <div className="empty-state"><h3>No shows found.</h3><p>No matches for “{query}”. Try another title or check the spelling.</p><button className="outline-button" onClick={() => search("")}>Explore suggestions</button></div>}
        {state.kind === "done" && state.results.length > 0 && <ul className="show-grid">{state.results.map((show) => (
          <li key={show.id}><Link href={`/shows/${show.id}${query ? `?q=${encodeURIComponent(query)}` : ""}`} className="show-card">
            {show.imageUrl ? <img src={show.imageUrl} alt="" loading="lazy" /> : <div className="show-card__fallback"><span aria-hidden="true">◇</span><span>Poster unavailable</span></div>}
            <span className="rating" aria-label={show.rating === null ? "Not rated" : `Rating ${show.rating} out of 10`}><span aria-hidden="true">★</span> {show.rating ?? "NR"}</span>
            <div className="show-card__body"><h3>{show.name}</h3><p className="show-card__year">{show.year ?? "Year unknown"}</p><p className="show-card__genres">{show.genres.join(" · ") || "Genres not listed"}</p></div>
          </Link></li>
        ))}</ul>}
      </section>
      <footer className="site-footer"><span>Reel <strong>Finder</strong></span><p>Stay curious. Find a story.</p><a href="https://www.tvmaze.com" target="_blank" rel="noopener noreferrer">Show data by TVmaze ↗</a></footer>
    </>
  );
}
