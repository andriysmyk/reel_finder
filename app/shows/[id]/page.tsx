"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ApiError, ShowDetails } from "@/lib/types";
import Marquee from "../../Marquee";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string; status: number }
  | { kind: "done"; show: ShowDetails };

export default function ShowPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/shows/${id}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({ error: "Unexpected response" }))) as ApiError;
          setState({ kind: "error", message: body.error, status: res.status });
          return;
        }
        setState({ kind: "done", show: (await res.json()) as ShowDetails });
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setState({ kind: "error", message: "Could not reach the server. Check your connection.", status: 0 });
      });
    return () => controller.abort();
  }, [id]);

  return (
    <>
      <Marquee subtitle="Show details" />
      <Link href="/" className="back" onClick={(e) => { if (history.length > 1) { e.preventDefault(); history.back(); } }}>
        Back to results
      </Link>

      {state.kind === "loading" && <p className="status">Loading show…</p>}
      {state.kind === "error" && (
        <p className="status status--error">
          {state.message}
          {state.status > 0 && <span className="status__code">HTTP {state.status}</span>}
        </p>
      )}
      {state.kind === "done" && (
        <article className="details">
          {state.show.imageUrl && <img className="details__poster" src={state.show.imageUrl} alt={`Poster for ${state.show.name}`} />}
          <div>
            <h2 className="details__title">{state.show.name}</h2>
            <dl className="details__facts">
              <dt>Premiered</dt><dd>{state.show.year ?? "Unknown"}</dd>
              <dt>Status</dt><dd>{state.show.status}</dd>
              <dt>Language</dt><dd>{state.show.language ?? "Unknown"}</dd>
              <dt>Runtime</dt><dd>{state.show.runtime ? `${state.show.runtime} min` : "Unknown"}</dd>
              <dt>Rating</dt><dd>{state.show.rating ?? "Not rated"}</dd>
              <dt>Genres</dt><dd>{state.show.genres.join(", ") || "Not listed"}</dd>
            </dl>
            <p className="details__summary">{state.show.summary}</p>
            {state.show.officialSite && (
              <a className="details__link" href={state.show.officialSite} target="_blank" rel="noopener noreferrer">
                Official site
              </a>
            )}
          </div>
        </article>
      )}
    </>
  );
}
