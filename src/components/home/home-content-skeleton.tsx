export default function HomeContentSkeleton() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="h-12 w-72 animate-pulse rounded bg-muted" />
      <div className="h-6 w-[32rem] max-w-full animate-pulse rounded bg-muted" />
      <div className="h-10 w-40 animate-pulse rounded bg-muted" />
    </main>
  );
}
