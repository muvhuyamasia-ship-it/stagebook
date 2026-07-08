import type { SignupRole } from "../../types/auth";

const roles: Array<{
  id: SignupRole;
  title: string;
  description: string;
  badge: string;
}> = [
  {
    id: "client",
    title: "Client",
    description: "Book verified talent, manage events, and pay through secure escrow.",
    badge: "Book Talent"
  },
  {
    id: "artist",
    title: "Artist",
    description: "Showcase your profile, manage availability, and receive protected payouts.",
    badge: "Join as Artist"
  },
  {
    id: "representative",
    title: "Representative",
    description: "Negotiate on behalf of artists with controlled access and audit visibility.",
    badge: "Manage Roster"
  }
];

interface RoleSelectorProps {
  value: SignupRole;
  onChange: (role: SignupRole) => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="role-selector" role="radiogroup" aria-label="Account role">
      {roles.map((role) => {
        const active = role.id === value;
        return (
          <button
            key={role.id}
            type="button"
            role="radio"
            aria-checked={active}
            className={`role-card${active ? " role-card--active" : ""}`}
            onClick={() => onChange(role.id)}
          >
            <span className="role-card__badge">{role.badge}</span>
            <span className="role-card__title">{role.title}</span>
            <span className="role-card__copy">{role.description}</span>
          </button>
        );
      })}
    </div>
  );
}