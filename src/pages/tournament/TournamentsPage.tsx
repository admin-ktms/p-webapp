import { Link } from "react-router-dom";

import TournamentTypeCard from "../../components/tournament/TournamentTypeCard";
import TournamentLoading from "../../components/tournament/TournamentLoading";
import TournamentEmptyState from "../../components/tournament/TournamentEmptyState";

import { useTournamentTypes } from "../../hooks/tournament/useTournamentTypes";

function TournamentsPage() {
  const {
    types,
    loading,
    error,
    refresh
  } = useTournamentTypes();

  return (
    <section className="tournaments-page">
      <header className="tournaments-page-header">
        <p className="tournaments-eyebrow">PLAYER ARENA</p>
        <h1>Tournaments</h1>
        <p className="tournaments-subtitle">
          Explore available tournament categories.
        </p>
      </header>

      <section className="tournament-types-section">
        <div className="tournament-section-heading">
          <div>
            <h2>Tournament Types</h2>
            <p>Choose a category to explore.</p>
          </div>

          <Link
            to="/tournaments/all"
            className="tournament-all-toggle"
          >
            All
          </Link>
        </div>

        {loading && (
          <TournamentLoading label="Loading tournament types..." />
        )}

        {!loading && error && (
          <TournamentEmptyState
            title="Could not load tournament types"
            description={error}
            onRetry={() => void refresh()}
          />
        )}

        {!loading && !error && types.length === 0 && (
          <TournamentEmptyState
            title="No active tournament types"
            description="There are currently no active tournament categories."
          />
        )}

        {!loading && !error && types.length > 0 && (
          <div className="tournament-types-list">
            {types.map((type) => (
              <TournamentTypeCard
                key={type.tournament_type_id}
                type={type}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default TournamentsPage;
