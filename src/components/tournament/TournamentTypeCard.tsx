import { ChevronRight, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { TournamentType } from "../../types/tournament.types";

interface TournamentTypeCardProps {
  type: TournamentType;
}

function TournamentTypeCard({
  type
}: TournamentTypeCardProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="tournament-type-card"
      onClick={() =>
        navigate(
          `/tournaments/type/${encodeURIComponent(
            type.tournament_type_id
          )}`
        )
      }
    >
      <span className="tournament-type-icon">
        <Trophy size={18} />
      </span>

      <span className="tournament-type-name">
        {type.tournament_type_name}
      </span>

      <ChevronRight
        size={18}
        className="tournament-type-arrow"
      />
    </button>
  );
}

export default TournamentTypeCard;
