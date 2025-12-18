export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className="flex justify-center items-center py-4">
      <div className={`${sizeClasses[size]} border-2 border-casino-primary/30 border-t-casino-primary rounded-full animate-spin`} />
    </div>
  );
}