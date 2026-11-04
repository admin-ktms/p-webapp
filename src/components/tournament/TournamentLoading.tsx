function TournamentLoading({
  label = "Loading tournaments..."
}: {
  label?: string;
}) {
  return (
    <div className="tournament-loading" role="status">
      <span className="tournament-spinner" />
      <span>{label}</span>
    </div>
  );
}

export default TournamentLoading;
