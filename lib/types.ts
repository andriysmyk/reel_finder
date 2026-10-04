// Normalized data returned by our API to the frontend
export interface ShowSummary {
  id: number;
  name: string;
  year: number | null;
  genres: string[];
  rating: number | null;
  imageUrl: string | null;
}

export interface ShowDetails extends ShowSummary {
  summary: string;
  language: string | null;
  runtime: number | null;
  status: string;
  officialSite: string | null;
}

export interface ApiError {
  error: string;
}
