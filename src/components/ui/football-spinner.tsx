import { cn } from "@/lib/utils";
import { Futbol } from "lucide-react";

export function FootballSpinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Futbol className="h-12 w-12 animate-spin text-primary" style={{ animationDuration: '1.5s' }}/>
    </div>
  );
}
