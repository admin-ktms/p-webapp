import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import TournamentCard from "../../components/tournament/TournamentCard";
import TournamentLoading from "../../components/tournament/TournamentLoading";
import TournamentEmptyState from "../../components/tournament/TournamentEmptyState";

import { useTournamentTypes } from "../../hooks/tournament/useTournamentTypes";
import { useTournamentDirectory } from "../../hooks/tournament/useTournamentDirectory";

function TournamentDirectoryPage() {
  const { typeId } = useParams<{ typeId: string }>();

  const tournamentTypeId = typeId ?? null;

  const {
    types,
    loading: typesLoading,
    error: typesError
  } = useTournamentTypes();

  const {
    tournaments,
    total,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore
  } = useTournamentDirectory(tournamentTypeId);

  const selectedType = tournamentTypeId
    ? types.find(
        (type) =>
          type.tournament_type_id === tournamentTypeId
      )
    : null;

  if (tournamentTypeId && typesLoading) {
    return (
      <TournamentLoading label="Loading tournament category..." />
    );
  }

  if (tournamentTypeId && typesError) {
    return (
      <TournamentEmptyState
        title="Could not verify tournament category"
        description={typesError}
      />
    );
  }

  if (tournamentTypeId && !selectedType) {
    return (
      <TournamentEmptyState
        title="Tournament category unavailable"
        description="This category is not currently active."
      />
    );
  }

  const pageTitle = selectedType
    ? selectedType.tournament_type_name
    : "All Tournaments";

  return (
    <section className="tournaments-page">
      <Link
        to="/tournaments"
        className="tournament-back-link"
      >
        <ArrowLeft size={17} />
        <span>Tournaments</span>
      </Link>

      <header className="tournament-directory-header">
        <p className="tournaments-eyebrow">
          TOURNAMENT DIRECTORY
        </p>

        <h1>{pageTitle}</h1>

        {!loading && (
          <p className="tournaments-subtitle">
            {total} {total === 1 ? "tournament" : "tournaments"}
          </p>
        )}
      </header>

      {loading && (
        <TournamentLoading />
      )}

      {!loading && error && tournaments.length === 0 && (
        <TournamentEmptyState
          title="Could not load tournaments"
          description={error}
          onRetry={() => void refresh()}
        />
      )}

      {!loading && !error && tournaments.length === 0 && (
        <TournamentEmptyState
          title="No tournaments found"
          description="There are currently no tournaments in this directory."
        />
      )}

      {!loading && tournaments.length > 0 && (
        <>
          <div className="tournament-directory-list">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.tournament_id}
                tournament={tournament}
              />
            ))}
          </div>

          {error && (
            <div className="tournament-pagination-error">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void loadMore()}
              >
                Retry
              </button>
            </div>
          )}

          {hasMore && (
            <button
              type="button"
              className="tournament-load-more"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default TournamentDirectoryPage;
