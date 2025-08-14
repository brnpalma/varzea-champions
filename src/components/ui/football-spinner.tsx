import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

export function FootballSpinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Trophy className="h-12 w-12 animate-pulse text-primary" />
    </div>
  );
}
