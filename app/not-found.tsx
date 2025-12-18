import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen  flex items-center justify-center pb-4 ">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Page Not Found
        </h2>
        <p className="text-foreground mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-10 px-4 py-2 bg-primary hover:bg-primary/50 text-primary-foreground rounded-md font-medium transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
