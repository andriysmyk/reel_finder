import type { ShowDetails, ShowSummary } from "./types";

const BASE_URL = process.env.TVMAZE_BASE_URL ?? "https://api.tvmaze.com";
const TIMEOUT_MS = 5000;

// Upstream service error with the HTTP status code returned to the client
export class UpstreamError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface RawShow {
  id: number;
  name: string;
  premiered: string | null;
  genres: string[];
  image: { medium: string; original: string } | null;
  rating: { average: number | null };
  summary: string | null;
  language: string | null;
  runtime: number | null;
  status: string;
  officialSite: string | null;
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 3600 },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new UpstreamError(504, "TVmaze did not respond in time");
    }
    throw new UpstreamError(502, "TVmaze is unreachable");
  }

  if (res.status === 404) throw new UpstreamError(404, "Show not found");
  if (res.status === 429) throw new UpstreamError(503, "TVmaze rate limit reached, try again shortly");
  if (!res.ok) throw new UpstreamError(502, `TVmaze responded with ${res.status}`);

  return (await res.json()) as T;
}

function toSummary(raw: RawShow): ShowSummary {
  return {
    id: raw.id,
    name: raw.name,
    year: raw.premiered ? Number(raw.premiered.slice(0, 4)) : null,
    genres: raw.genres,
    rating: raw.rating.average,
    imageUrl: raw.image?.medium ?? null,
  };
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

export async function searchShows(query: string): Promise<ShowSummary[]> {
  const data = await get<{ show: RawShow }[]>(`/search/shows?q=${encodeURIComponent(query)}`);
  return data.map((item) => toSummary(item.show));
}

export async function getShow(id: number): Promise<ShowDetails> {
  const raw = await get<RawShow>(`/shows/${id}`);
  return {
    ...toSummary(raw),
    imageUrl: raw.image?.original ?? raw.image?.medium ?? null,
    summary: raw.summary ? stripHtml(raw.summary) : "No description available.",
    language: raw.language,
    runtime: raw.runtime,
    status: raw.status,
    officialSite: raw.officialSite,
  };
}
