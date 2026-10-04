import { Suspense } from "react";
import SearchView from "./SearchView";

export default function HomePage() {
  // useSearchParams in a client component requires a Suspense boundary
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  );
}
