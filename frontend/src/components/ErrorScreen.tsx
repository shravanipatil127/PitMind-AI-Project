import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorScreen({
  message = "Something went wrong while fetching race data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="glass-panel flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
      <AlertTriangle className="text-pit-red" size={32} />
      <p className="text-pit-text font-medium">{message}</p>
      <p className="text-pit-muted text-sm max-w-sm">
        This can happen if there's no live session right now, or the backend can't reach OpenF1.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-pit-red/15 text-pit-red border border-pit-red/30 hover:bg-pit-red/25 transition-colors text-sm"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}
