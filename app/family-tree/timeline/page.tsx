import { Suspense } from "react";
import { fetchMembersForTimeline } from "../actions";
import { TimelineClient } from "./timeline-client";

async function TimelineWrapper() {
  const members = await fetchMembersForTimeline();
  return <TimelineClient initialData={members} />;
}

export default function TimelinePage() {
  return (
    <div className="container mx-auto py-6">
       <Suspense fallback={<div>Loading timeline...</div>}>
         <TimelineWrapper />
       </Suspense>
    </div>
  );
}