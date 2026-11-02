
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
}

function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="page-placeholder">
      <div className="placeholder-icon">
        <Construction size={28} />
      </div>

      <p className="eyebrow">PLAYER ARENA</p>

      <h1>{title}</h1>

      <p className="placeholder-description">
        This section is under development.
        Check back as we build your player experience.
      </p>
    </section>
  );
}

export default PlaceholderPage;
