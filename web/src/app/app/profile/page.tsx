import { Suspense } from "react";
import { ProfilePage } from "./ProfilePage";

export default function ProfileRoute() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col">
          <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
            <div className="ql-skeleton-line w-48 h-8" />
            <div className="ql-skeleton-line w-72 h-4 mt-2" />
            <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="ql-skeleton-card rounded-xl p-5 space-y-3">
                  <div className="ql-skeleton-line w-20" />
                  <div className="ql-skeleton-line w-32 h-8 mt-2" />
                </div>
              ))}
            </div>
          </div>
        </main>
      }
    >
      <ProfilePage />
    </Suspense>
  );
}