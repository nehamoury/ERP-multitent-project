import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-primary">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-sm font-medium animate-pulse text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
}
