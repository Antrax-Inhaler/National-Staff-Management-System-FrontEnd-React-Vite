export const Positions = {
  PRESIDENT: "President",
  VICE_PRESIDENT: "Vice President",
  SECRETARY: "Secretary",
  TREASURER: "Treasurer",
  GRIEVANCE_CHAIR: "Grievance Chair",
  BARGAINING_CHAIR: "Bargaining Chair",
  COMMUNICATIONS_COMMITTEE_CHAIR: "Communications Commitee Chair",
  HEALTH_INSURANCE_COMMITTEE_CHAIR_STAFF_REPRESENTATIVE:
    "Health Insurance Committee Chair/Staff Representative",
  FOUR_OH_ONE_K_COMMITTEE_CHAIR_STAFF_REPRESENTATIVE:
    "401k Committee Chair/Staff Representative",
  PENSION_COMMITTEE_CHAIR_STAFF_REPRESENTATIVE:
    "Pension Committee Chair/Staff Representative",
    MEMBERSHIP_CHAIR: "Membership Chair",
} as const;

export type Position = (typeof Positions)[keyof typeof Positions];
