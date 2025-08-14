import { cn } from "@/lib/utils";

export function FootballSpinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative w-16 h-16", className)}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full animate-spin"
        style={{ animationDuration: '1.5s' }}
      >
        <circle cx="50" cy="50" r="48" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        
        {/* Central Pentagon */}
        <polygon points="50,20 69,35 60,58 40,58 31,35" fill="hsl(var(--foreground))" />

        {/* Top Hexagons */}
        <polygon points="50,20 31,35 20,30 35,10" fill="hsl(var(--card-foreground))" />
        <polygon points="50,20 69,35 79,30 65,10" fill="hsl(var(--card-foreground))" />

        {/* Side Hexagons */}
        <polygon points="31,35 40,58 30,70 12,60 20,30" fill="hsl(var(--card-foreground))" />
        <polygon points="69,35 60,58 70,70 88,60 79,30" fill="hsl(var(--card-foreground))" />
        
        {/* Bottom Hexagon */}
        <polygon points="40,58 60,58 65,80 50,90 35,80" fill="hsl(var(--card-foreground))" />
      </svg>
    </div>
  );
}