// src/constants/roles.ts
export const Roles = {
  NATIONAL_ADMINISTRATOR: "national_administrator",
  ORG_EXECUTIVE_COMMITEE: "ORG_executive_commitee",
  ORG_RESEARCH_COMMITEE: "ORG_research_commitee",
  AFFILIATE_MEMBER: "affiliate_member",
  AFFILIATE_OFFICER: "affiliate_officer",

  // Executive Committee Specific Roles
  PRESIDENT: "president",
  VICE_PRESIDENT_DEFENSE: "vice_president_defense",
  VICE_PRESIDENT_PROGRAM: "vice_president_program",
  SECRETARY: "secretary",
  TREASURER: "treasurer",
  REGION_1_DIRECTOR: "region_1_director",
  REGION_2_DIRECTOR: "region_2_director",
  REGION_3_DIRECTOR: "region_3_director",
  REGION_4_DIRECTOR: "region_4_director",
  REGION_5_DIRECTOR: "region_5_director",
  REGION_6_DIRECTOR: "region_6_director",
  REGION_7_DIRECTOR: "region_7_director",
  AT_LARGE_DIRECTOR_ASSOCIATE: "at_large_director_associate",
  AT_LARGE_DIRECTOR_PROFESSIONAL: "at_large_director_professional",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const National_Roles = [
  Roles.NATIONAL_ADMINISTRATOR,
  Roles.ORG_EXECUTIVE_COMMITEE,
  Roles.ORG_RESEARCH_COMMITEE,
  Roles.PRESIDENT,
  Roles.VICE_PRESIDENT_DEFENSE,
  Roles.VICE_PRESIDENT_PROGRAM,
  Roles.SECRETARY,
  Roles.TREASURER,
  Roles.AT_LARGE_DIRECTOR_ASSOCIATE,
  Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
  Roles.REGION_1_DIRECTOR,
  Roles.REGION_2_DIRECTOR,
  Roles.REGION_3_DIRECTOR,
  Roles.REGION_4_DIRECTOR,
  Roles.REGION_5_DIRECTOR,
  Roles.REGION_6_DIRECTOR,
  Roles.REGION_7_DIRECTOR,
];

export const Committees = {
  NSO: [Roles.ORG_EXECUTIVE_COMMITEE, Roles.ORG_RESEARCH_COMMITEE],
  EXECUTIVE_COMMITTEE: [
    Roles.PRESIDENT,
    Roles.VICE_PRESIDENT_DEFENSE,
    Roles.VICE_PRESIDENT_PROGRAM,
    Roles.SECRETARY,
    Roles.TREASURER,
    Roles.AT_LARGE_DIRECTOR_ASSOCIATE,
    Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
  ],
  REGIONAL_DIRECTORS: [
    Roles.REGION_1_DIRECTOR,
    Roles.REGION_2_DIRECTOR,
    Roles.REGION_3_DIRECTOR,
    Roles.REGION_4_DIRECTOR,
    Roles.REGION_5_DIRECTOR,
    Roles.REGION_6_DIRECTOR,
    Roles.REGION_7_DIRECTOR,
  ],
};
