import { cn } from "@/lib/utils";

export function FootballSpinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative w-16 h-16 animate-spin-slow", className)}
      style={{ animationDuration: '2s' }}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <circle cx="50" cy="50" r="48" fill="var(--card)" stroke="var(--foreground)" strokeWidth="2" />
        <polygon points="50,10 65,35 35,35" fill="var(--foreground)" />
        <polygon points="50,90 35,65 65,65" fill="var(--foreground)" />
        <polygon points="19,69 10,50 35,35" fill="var(--foreground)" />
        <polygon points="81,69 65,35 90,50" fill="var(--foreground)" />
        <polygon points="19,31 35,65 10,50" fill="var(--foreground)" />
        <polygon points="81,31 90,50 65,65" fill="var(--foreground)" />
      </svg>
    </div>
  );
}
