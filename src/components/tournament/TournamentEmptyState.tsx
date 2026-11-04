import { RefreshCw, Trophy } from "lucide-react";

interface TournamentEmptyStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
}

function TournamentEmptyState({
  title,
  description,
  onRetry
}: TournamentEmptyStateProps) {
  return (
    <div className="tournament-empty-state">
      <span className="tournament-empty-icon">
        <Trophy size={23} />
      </span>

      <h3>{title}</h3>

      <p>{description}</p>

      {onRetry && (
        <button
          type="button"
          className="tournament-retry-button"
          onClick={onRetry}
        >
          <RefreshCw size={15} />
          Retry
        </button>
      )}
    </div>
  );
}

export default TournamentEmptyState;
