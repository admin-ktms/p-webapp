
import {
  ClipboardList,
  RefreshCw,
  Search,
  ChevronDown,
  CreditCard
} from "lucide-react";

import PageLayout from "../../components/layout/PageLayout";
import { useRegistrations } from "../../hooks/registration/useRegistrations";

import type {
  PlayerRegistration
} from "../../types/registration.types";

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function getStatusClass(status: string): string {
  const normalized = status.toLowerCase();

  if (
    normalized === "registered" ||
    normalized === "active" ||
    normalized === "approved" ||
    normalized === "completed"
  ) {
    return "registration-status-success";
  }

  if (
    normalized === "pending payment" ||
    normalized === "awaiting verification"
  ) {
    return "registration-status-pending";
  }

  if (
    normalized === "rejected" ||
    normalized === "expired" ||
    normalized === "cancelled" ||
    normalized === "disqualified"
  ) {
    return "registration-status-danger";
  }

  return "registration-status-neutral";
}

function RegistrationRow({
  registration
}: {
  registration: PlayerRegistration;
}) {
  const canCompletePayment =
    registration.status === "Pending Payment";

  return (
    <article className="registration-record">
      <div className="registration-record-main">
        <div className="registration-record-tournament">
          <strong>
            {registration.tournament_name || "Tournament"}
          </strong>

          <span>{registration.tournament_id}</span>
        </div>

        <div className="registration-record-type">
          <span>TYPE</span>
          <strong>{registration.tournament_type_id}</strong>
        </div>

        <div className="registration-record-squad">
          <span>SQUAD</span>
          <strong>{registration.squad_name || "—"}</strong>
        </div>

        <div className="registration-record-amount">
          <span>AMOUNT PAID</span>
          <strong>
            {formatCurrency(registration.amount_paid)}
          </strong>
        </div>

        <div className="registration-record-fee">
          <span>REGISTRATION FEE</span>
          <strong>
            {formatCurrency(registration.registration_fee)}
          </strong>
        </div>

        <div className="registration-record-method">
          <span>METHOD</span>
          <strong>
            {registration.payment_method || "—"}
          </strong>
        </div>
      </div>

      <div className="registration-record-footer">
        <span
          className={`registration-status ${getStatusClass(
            registration.status
          )}`}
        >
          {registration.status}
        </span>

        <span className="registration-record-date">
          {formatDate(
            registration.registration_datetime ||
            registration.request_datetime
          )}
        </span>

        {canCompletePayment && (
          <button
            type="button"
            className="registration-payment-button"
            disabled
            title="Payment integration is not yet available"
          >
            <CreditCard size={14} />
            Complete payment
          </button>
        )}
      </div>
    </article>
  );
}

function RegistrationsPage() {
  const {
    registrations,
    providers,
    totalCount,
    offset,

    status,
    tournamentTypeId,
    tournamentId,

    loading,
    error,
    hasMore,

    setStatus,
    setTournamentTypeId,
    setTournamentId,

    refresh,
    loadMore
  } = useRegistrations();


  return (
    <PageLayout
      className="registrations-page"
      header={
        <header className="registrations-page-header">
          <div className="registrations-heading">
            <span className="registrations-heading-icon">
              <ClipboardList size={20} />
            </span>

            <div>
              <p className="registrations-eyebrow">
                PLAYER ARENA
              </p>

              <h1>My Registrations</h1>

              <p>
                Your current and historical tournament registrations.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="registrations-refresh-button"
            onClick={() => void refresh()}
            disabled={loading}
            aria-label="Refresh registrations"
          >
            <RefreshCw
              size={17}
              className={loading ? "registration-spinner" : ""}
            />
          </button>
        </header>
      }
    >
      <div className="registrations-content">
        <section className="registrations-summary">
          <div>
            <span>TOTAL REGISTRATIONS</span>
            <strong>{totalCount}</strong>
          </div>

          <div>
            <span>DISPLAYED</span>
            <strong>{registrations.length}</strong>
          </div>
        </section>

        <section className="registrations-filters">
          <label className="registration-filter">
            <span>Status</span>

            <span className="registration-select-wrapper">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="Pending Payment">Pending Payment</option>
                <option value="Awaiting Verification">
                  Awaiting Verification
                </option>
                <option value="Approved">Approved</option>
                <option value="Registered">Registered</option>
                <option value="Active">Active</option>
                <option value="Eliminated">Eliminated</option>
                <option value="Disqualified">Disqualified</option>
                <option value="Withdrawn">Withdrawn</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Refund Required">Refund Required</option>
              </select>

              <ChevronDown size={15} />
            </span>
          </label>

          <label className="registration-filter">
            <span>Tournament type</span>

            <span className="registration-select-wrapper">
              <select
                value={tournamentTypeId}
                onChange={(event) =>
                  setTournamentTypeId(event.target.value)
                }
              >
                <option value="">All types</option>

                {providers.map((provider) => (
                  <option
                    key={provider.tournament_type_id}
                    value={provider.tournament_type_id}
                  >
                    {provider.tournament_type_name}
                  </option>
                ))}
              </select>

              <ChevronDown size={15} />
            </span>
          </label>

          <label className="registration-filter registration-tournament-search">
            <span>Tournament ID</span>

            <span className="registration-search-wrapper">
              <Search size={15} />

              <input
                type="search"
                value={tournamentId}
                onChange={(event) =>
                  setTournamentId(event.target.value)
                }
                placeholder="Search tournament ID"
              />
            </span>
          </label>
        </section>

        {providers.some(
          (provider) =>
            provider.status === "error" ||
            provider.status === "not_implemented"
        ) && (
          <div className="registration-provider-notice">
            Some tournament types cannot currently provide registration
            history. Available records are still displayed.
          </div>
        )}

        {error && (
          <div className="registration-error" role="alert">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => void refresh()}
            >
              Try again
            </button>
          </div>
        )}

        {loading && registrations.length === 0 ? (
          <div className="registration-state">
            <RefreshCw className="registration-spinner" size={23} />
            <p>Loading registrations...</p>
          </div>
        ) : !error && registrations.length === 0 ? (
          <div className="registration-state">
            <ClipboardList size={30} />
            <strong>No registrations found</strong>
            <p>
              Your tournament registration history will appear here.
            </p>
          </div>
        ) : (
          <section className="registration-list">
            <div className="registration-list-heading">
              <h2>Registration history</h2>
              <span>{registrations.length} records</span>
            </div>

            {registrations.map((registration, index) => (
              <RegistrationRow
                key={
                  registration.registration_reference_id ||
                  registration.request_id ||
                  `${registration.tournament_id}-${index}`
                }
                registration={registration}
              />
            ))}
          </section>
        )}

        {loading && registrations.length > 0 && (
          <p className="registration-loading-more">
            Updating registrations...
          </p>
        )}

        {hasMore && !loading && (
          <button
            type="button"
            className="registration-load-more"
            onClick={() => void loadMore()}
          >
            Load more
          </button>
        )}

        {offset > 0 && !hasMore && (
          <p className="registration-end-note">
            You have reached the end of your registration history.
          </p>
        )}
      </div>
    </PageLayout>
  );
}

export default RegistrationsPage;
