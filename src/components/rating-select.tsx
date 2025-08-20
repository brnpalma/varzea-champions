
"use client";

import { Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RatingSelectProps {
  id?: string;
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

export function RatingSelect({ id, value, onValueChange, disabled }: RatingSelectProps) {
  return (
    <Select
      value={value.toString()}
      onValueChange={(v) => onValueChange(Number(v))}
      disabled={disabled}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder="Selecione a classificação" />
      </SelectTrigger>
      <SelectContent>
        {[5, 4, 3, 2, 1].map((r) => (
          <SelectItem key={r} value={r.toString()}>
            <div className="flex items-center gap-2">
              {r}
              <div className="flex items-center">
                {[...Array(r)].map((_, i) => (
                  <Star
                    key={`filled-${i}`}
                    className="h-4 w-4 text-amber-500 fill-current"
                  />
                ))}
                {[...Array(5 - r)].map((_, i) => (
                  <Star
                    key={`empty-${i}`}
                    className="h-4 w-4 text-muted-foreground/30"
                  />
                ))}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
