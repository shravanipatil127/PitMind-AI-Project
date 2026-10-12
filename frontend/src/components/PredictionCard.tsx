import type { ReactNode } from "react";

export default function PredictionCard({
  title,
  icon,
  confidence,
  children,
}: {
  title: string;
  icon?: ReactNode;
  confidence?: number;
  children: ReactNode;
}) {
  return (
    <div className="glass-panel glass-panel-hover p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </div>
        {confidence !== undefined && (
          <span className="badge bg-white/5 text-pit-muted border border-pit-border">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>
      <div className="text-sm text-pit-muted leading-relaxed">{children}</div>
    </div>
  );
}
