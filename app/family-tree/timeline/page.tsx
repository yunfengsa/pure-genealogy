import { Suspense } from "react";
import { fetchMembersForTimeline } from "../actions";
import { TimelineClient } from "./timeline-client";

export default async function TimelinePage() {
  const members = await fetchMembersForTimeline();

  return (
    <div className="container mx-auto py-6">
       <Suspense fallback={<div>Loading timeline...</div>}>
         <TimelineClient initialData={members} />
       </Suspense>
    </div>
  );
}
