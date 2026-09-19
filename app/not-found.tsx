import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-md text-sm text-[var(--color-text-secondary)]">
        The page you were looking for doesn&apos;t exist, or a link may be out of date.
      </p>
      <Link href="/" className="text-sm text-[var(--color-violet)] underline">
        Return home
      </Link>
    </div>
  );
}
