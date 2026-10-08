import { Loader2 } from "lucide-react";

export default function LoginLoading() {
  return (
    <div className="bg-black min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] w-full flex items-center justify-center font-mono">
      <div className="w-full max-w-md bg-black/90 backdrop-blur-md border border-green-500/30 rounded-lg overflow-hidden shadow-[0_0_50px_-12px_rgba(0,255,0,0.2)] p-12 flex flex-col items-center">
        <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-6" />
        <h2 className="text-xl font-bold tracking-tight text-green-400">INITIALIZING LOGIN...</h2>
        <p className="text-xs text-green-500/60 uppercase tracking-widest mt-2">
          Establishing secure connection
        </p>
      </div>
    </div>
  );
}
