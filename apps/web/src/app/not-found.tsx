import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <Link href="/dashboard" className="text-sm text-primary underline underline-offset-4 hover:text-primary/80">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
