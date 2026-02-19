// SidebarMenu.tsx
import React from "react";
import {
  Home,
  Building2,
  FileText,
  User,
  Link as LinkIcon,
  BookOpen,
  ShieldCheck,
  UserCheck,
  Layers,
  ShieldUser,
  Info,
  Play,
  Users,
  SearchCheck,
  ShieldQuestionMark,
  Newspaper,
} from "lucide-react";
import { National_Roles, Roles } from "../../constants/roles";
import { Positions } from "../../constants/positions";

export interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
  permissions?: string[];
  roles?: string[];
  positions?: string[];
}

export interface NavGroup {
  title: string;
  items?: NavItemProps[];
  permissions?: string[];
  roles?: string[];
  positions?: string[];
}

interface SidebarMenuProps {
  missingDataCount: number;
  national?: boolean;
}

export const getSidebarMenus = ({
  missingDataCount,
  national,
}: SidebarMenuProps): NavGroup[] => [
  {
    title: "Main",
    roles: [
      Roles.ORG_EXECUTIVE_COMMITEE,
      Roles.ORG_RESEARCH_COMMITEE,
      Roles.NATIONAL_ADMINISTRATOR,
      Roles.AFFILIATE_OFFICER,
      Roles.AFFILIATE_MEMBER,
      Roles.PRESIDENT,
      Roles.VICE_PRESIDENT_DEFENSE,
      Roles.VICE_PRESIDENT_PROGRAM,
      Roles.SECRETARY,
      Roles.REGION_1_DIRECTOR,
      Roles.REGION_2_DIRECTOR,
      Roles.REGION_3_DIRECTOR,
      Roles.REGION_4_DIRECTOR,
      Roles.REGION_5_DIRECTOR,
      Roles.REGION_6_DIRECTOR,
      Roles.REGION_7_DIRECTOR,
      Roles.AT_LARGE_DIRECTOR_ASSOCIATE,
      Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
    ],
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: Home,
        active: true,
        roles: [
          Roles.ORG_EXECUTIVE_COMMITEE,
          Roles.ORG_RESEARCH_COMMITEE,
          Roles.NATIONAL_ADMINISTRATOR,
          Roles.AFFILIATE_MEMBER,
          Roles.AFFILIATE_OFFICER,
          Roles.PRESIDENT,
          Roles.VICE_PRESIDENT_DEFENSE,
          Roles.VICE_PRESIDENT_PROGRAM,
          Roles.SECRETARY,
          Roles.REGION_1_DIRECTOR,
          Roles.REGION_2_DIRECTOR,
          Roles.REGION_3_DIRECTOR,
          Roles.REGION_4_DIRECTOR,
          Roles.REGION_5_DIRECTOR,
          Roles.REGION_6_DIRECTOR,
          Roles.REGION_7_DIRECTOR,
          Roles.AT_LARGE_DIRECTOR_ASSOCIATE,
          Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
        ],
      },
      {
        href: "/profile",
        label: "My Profile",
        icon: User,
        badge: missingDataCount > 0 ? missingDataCount.toString() : undefined,
        roles: [
          Roles.ORG_EXECUTIVE_COMMITEE,
          Roles.ORG_RESEARCH_COMMITEE,
          Roles.NATIONAL_ADMINISTRATOR,
          Roles.AFFILIATE_MEMBER,
          Roles.AFFILIATE_OFFICER,
          Roles.PRESIDENT,
          Roles.VICE_PRESIDENT_DEFENSE,
          Roles.VICE_PRESIDENT_PROGRAM,
          Roles.SECRETARY,
          Roles.REGION_1_DIRECTOR,
          Roles.REGION_2_DIRECTOR,
          Roles.REGION_3_DIRECTOR,
          Roles.REGION_4_DIRECTOR,
          Roles.REGION_5_DIRECTOR,
          Roles.REGION_6_DIRECTOR,
          Roles.REGION_7_DIRECTOR,
          Roles.AT_LARGE_DIRECTOR_ASSOCIATE,
          Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
        ],
      },
    ],
  },
  {
    title: "Management",
    roles: [
      Roles.AFFILIATE_OFFICER,
      Roles.ORG_EXECUTIVE_COMMITEE,
      Roles.ORG_RESEARCH_COMMITEE,
      Roles.NATIONAL_ADMINISTRATOR,
      Roles.PRESIDENT,
      Roles.VICE_PRESIDENT_DEFENSE,
      Roles.VICE_PRESIDENT_PROGRAM,
      Roles.SECRETARY,
      Roles.REGION_1_DIRECTOR,
      Roles.REGION_2_DIRECTOR,
      Roles.REGION_3_DIRECTOR,
      Roles.REGION_4_DIRECTOR,
      Roles.REGION_5_DIRECTOR,
      Roles.REGION_6_DIRECTOR,
      Roles.REGION_7_DIRECTOR,
      Roles.AT_LARGE_DIRECTOR_ASSOCIATE,
      Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
    ],
    items: [
      {
        href: "/affiliates",
        label: !national ? "Affiliates" : "Affiliate",
        icon: Building2,
        roles: [
          Roles.ORG_EXECUTIVE_COMMITEE,
          Roles.ORG_RESEARCH_COMMITEE,
          Roles.NATIONAL_ADMINISTRATOR,
          Roles.PRESIDENT,
          Roles.VICE_PRESIDENT_DEFENSE,
          Roles.VICE_PRESIDENT_PROGRAM,
          Roles.SECRETARY,
          Roles.REGION_1_DIRECTOR,
          Roles.REGION_2_DIRECTOR,
          Roles.REGION_3_DIRECTOR,
          Roles.REGION_4_DIRECTOR,
          Roles.REGION_5_DIRECTOR,
          Roles.REGION_6_DIRECTOR,
          Roles.REGION_7_DIRECTOR,
          Roles.AT_LARGE_DIRECTOR_ASSOCIATE,
          Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
        ],
        positions: [
          Positions.PRESIDENT,
          Positions.SECRETARY,
          Positions.TREASURER,
        ],
      },
      {
        href: "/members",
        label: "Members",
        icon: Users,
        roles: [
          Roles.ORG_EXECUTIVE_COMMITEE,
          Roles.ORG_RESEARCH_COMMITEE,
          Roles.NATIONAL_ADMINISTRATOR,
          Roles.AFFILIATE_MEMBER,
          Roles.AFFILIATE_OFFICER,
          Roles.PRESIDENT,
          Roles.VICE_PRESIDENT_DEFENSE,
          Roles.VICE_PRESIDENT_PROGRAM,
          Roles.SECRETARY,
          Roles.REGION_1_DIRECTOR,
          Roles.REGION_2_DIRECTOR,
          Roles.REGION_3_DIRECTOR,
          Roles.REGION_4_DIRECTOR,
          Roles.REGION_5_DIRECTOR,
          Roles.REGION_6_DIRECTOR,
          Roles.REGION_7_DIRECTOR,
          Roles.AT_LARGE_DIRECTOR_ASSOCIATE,
          Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
        ],
      },
      {
        href: "/officers",
        label: "Officers",
        icon: UserCheck,
        roles: [Roles.AFFILIATE_OFFICER],
      },
      {
        href: "/leader-roster",
        label: "National Leaders",
        icon: ShieldUser,
        roles: [
          Roles.ORG_EXECUTIVE_COMMITEE,
          Roles.ORG_RESEARCH_COMMITEE,
          Roles.NATIONAL_ADMINISTRATOR,
          Roles.PRESIDENT,
          Roles.VICE_PRESIDENT_DEFENSE,
          Roles.VICE_PRESIDENT_PROGRAM,
          Roles.SECRETARY,
          Roles.REGION_1_DIRECTOR,
          Roles.REGION_2_DIRECTOR,
          Roles.REGION_3_DIRECTOR,
          Roles.REGION_4_DIRECTOR,
          Roles.REGION_5_DIRECTOR,
          Roles.REGION_6_DIRECTOR,
          Roles.REGION_7_DIRECTOR,
          Roles.AT_LARGE_DIRECTOR_ASSOCIATE,
          Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
        ],
      },
      {
        href: "/audit-logs",
        label: "Audit Logs",
        icon: ShieldQuestionMark,
        roles: [
          Roles.NATIONAL_ADMINISTRATOR,
          Roles.PRESIDENT,
          Roles.VICE_PRESIDENT_DEFENSE,
          Roles.VICE_PRESIDENT_PROGRAM,
          Roles.SECRETARY,
          Roles.REGION_1_DIRECTOR,
          Roles.REGION_2_DIRECTOR,
          Roles.REGION_3_DIRECTOR,
          Roles.REGION_4_DIRECTOR,
          Roles.REGION_5_DIRECTOR,
          Roles.REGION_6_DIRECTOR,
          Roles.REGION_7_DIRECTOR,
          Roles.AT_LARGE_DIRECTOR_ASSOCIATE,
          Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
        ],
      },
    ],
  },
  {
    title: "Resources",
    roles: [Roles.AFFILIATE_MEMBER],
    items: [
      {
        href: "/national-documents",
        label: "National Documents",
        icon: Info,
        roles: [Roles.AFFILIATE_MEMBER],
      },
      {
        href: "/research-documents",
        label: "Research Documents",
        icon: FileText,
        roles: [...National_Roles],
        positions: [
          Positions.PRESIDENT,
          Positions.SECRETARY,
          Positions.BARGAINING_CHAIR,
          Positions.GRIEVANCE_CHAIR,
        ],
      },
      {
        href: "/governance-documents",
        label: "Governance Documents",
        icon: ShieldCheck,
        roles: [...National_Roles],
        positions: [
          Positions.PRESIDENT,
          Positions.SECRETARY,
          Positions.BARGAINING_CHAIR,
          Positions.GRIEVANCE_CHAIR,
        ],
      },
      {
        href: "/information",
        label: "Information Management",
        icon: BookOpen,
        roles: [
          Roles.ORG_EXECUTIVE_COMMITEE,
          Roles.ORG_RESEARCH_COMMITEE,
          Roles.NATIONAL_ADMINISTRATOR,
        ],
      },
      {
        href: "/national-information",
        label: "National Information",
        icon: Newspaper,
        roles: [Roles.AFFILIATE_MEMBER],
      },
      {
        href: "/links",
        label: "Link Directory",
        icon: LinkIcon,
        roles: [Roles.AFFILIATE_OFFICER, Roles.AFFILIATE_MEMBER],
      },
      {
        href: "/link-management",
        label: "Link Management",
        icon: Layers,
        roles: [...National_Roles],
      },
      // {
      //   href: "/help-videos",
      //   label: "Help",
      //   icon: Play,
      //   roles: [
      //     Roles.ORG_EXECUTIVE_COMMITEE,
      //     Roles.ORG_RESEARCH_COMMITEE,
      //     Roles.NATIONAL_ADMINISTRATOR,
      //     Roles.PRESIDENT,
      //     Roles.VICE_PRESIDENT_DEFENSE,
      //     Roles.VICE_PRESIDENT_PROGRAM,
      //     Roles.SECRETARY,
      //     Roles.REGION_1_DIRECTOR,
      //     Roles.REGION_2_DIRECTOR,
      //     Roles.REGION_3_DIRECTOR,
      //     Roles.REGION_4_DIRECTOR,
      //     Roles.REGION_5_DIRECTOR,
      //     Roles.REGION_6_DIRECTOR,
      //     Roles.REGION_7_DIRECTOR,
      //     Roles.AT_LARGE_DIRECTOR_ASSOCIATE,
      //     Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
      //   ],
      // },
    ],
  },
];

// Helper functions that were in Sidebar
export const getPortalTitle = (roles: string[]) => {
  const nationalRoles = [
    Roles.ORG_EXECUTIVE_COMMITEE,
    Roles.ORG_RESEARCH_COMMITEE,
    Roles.NATIONAL_ADMINISTRATOR,
    Roles.PRESIDENT,
    Roles.VICE_PRESIDENT_DEFENSE,
    Roles.VICE_PRESIDENT_PROGRAM,
    Roles.SECRETARY,
    Roles.REGION_1_DIRECTOR,
    Roles.REGION_2_DIRECTOR,
    Roles.REGION_3_DIRECTOR,
    Roles.REGION_4_DIRECTOR,
    Roles.REGION_5_DIRECTOR,
    Roles.REGION_6_DIRECTOR,
    Roles.REGION_7_DIRECTOR,
    Roles.AT_LARGE_DIRECTOR_ASSOCIATE,
    Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
  ];

  if (nationalRoles.some((r) => roles.includes(r))) {
    return "National Portal";
  }

  if (roles.includes(Roles.AFFILIATE_OFFICER)) {
    return "Affiliate Portal";
  }

  if (roles.includes(Roles.AFFILIATE_MEMBER)) {
    return "Member Portal";
  }

  return "ORG Portal";
};

export const getUserTitle = (roles: string[], affiliateName?: string) => {
  const hasNationalAdmin = roles.includes(Roles.NATIONAL_ADMINISTRATOR);
  const hasExecutive = roles.includes(Roles.ORG_EXECUTIVE_COMMITEE);
  const hasResearch = roles.includes(Roles.ORG_RESEARCH_COMMITEE);
  const hasPresident = roles.includes(Roles.PRESIDENT);
  const hasVicePresidentDefense = roles.includes(Roles.VICE_PRESIDENT_DEFENSE);
  const hasVicePresidentProgram = roles.includes(Roles.VICE_PRESIDENT_PROGRAM);
  const hasSecretary = roles.includes(Roles.SECRETARY);
  const hasRegion1 = roles.includes(Roles.REGION_1_DIRECTOR);
  const hasRegion2 = roles.includes(Roles.REGION_2_DIRECTOR);
  const hasRegion3 = roles.includes(Roles.REGION_3_DIRECTOR);
  const hasRegion4 = roles.includes(Roles.REGION_4_DIRECTOR);
  const hasRegion5 = roles.includes(Roles.REGION_5_DIRECTOR);
  const hasRegion6 = roles.includes(Roles.REGION_6_DIRECTOR);
  const hasRegion7 = roles.includes(Roles.REGION_7_DIRECTOR);
  const hasAtLargeAssociate = roles.includes(Roles.AT_LARGE_DIRECTOR_ASSOCIATE);
  const hasAtLargeProfessional = roles.includes(
    Roles.AT_LARGE_DIRECTOR_PROFESSIONAL,
  );
  const hasAffiliateOfficer = roles.includes(Roles.AFFILIATE_OFFICER);
  const hasAffiliateMember = roles.includes(Roles.AFFILIATE_MEMBER);

  // Determine main ORG role (highest precedence)
  let nsoRole: string | null = null;
  if (hasPresident) nsoRole = "President";
  else if (hasVicePresidentDefense) nsoRole = "Vice-President of Defense";
  else if (hasVicePresidentProgram) nsoRole = "Vice-President of Program";
  else if (hasSecretary) nsoRole = "Secretary";
  else if (hasRegion1) nsoRole = "Region 1 Director";
  else if (hasRegion2) nsoRole = "Region 2 Director";
  else if (hasRegion3) nsoRole = "Region 3 Director";
  else if (hasRegion4) nsoRole = "Region 4 Director";
  else if (hasRegion5) nsoRole = "Region 5 Director";
  else if (hasRegion6) nsoRole = "Region 6 Director";
  else if (hasRegion7) nsoRole = "Region 7 Director";
  else if (hasAtLargeAssociate) nsoRole = "At-Large Director - Associate";
  else if (hasAtLargeProfessional) nsoRole = "At-Large Director - Professional";
  else if (hasNationalAdmin) nsoRole = "National Administrator";
  else if (hasExecutive) nsoRole = "ORG Executive Committee";
  else if (hasResearch) nsoRole = "ORG Research Committee";

  // Determine affiliate role
  let affiliateRole: string | null = null;
  if (hasAffiliateOfficer) affiliateRole = `${affiliateName || ""} Officer`;
  else if (hasAffiliateMember) affiliateRole = `${affiliateName || ""} Member`;

  // Combine if both exist
  if (nsoRole && affiliateRole) {
    return `${nsoRole} / ${affiliateRole}`;
  }

  // Otherwise return whichever exists
  return nsoRole || affiliateRole || "ORG Portal";
};

export const formatFieldName = (field: string): string => {
  const fieldMap: Record<string, string> = {
    member_id: "Membership ID",
    first_name: "First Name",
    last_name: "Last Name",
    work_email: "Email Address",
    address_line1: "Street Address",
    city: "City",
    state: "State",
    zip_code: "ZIP Code",
    mobile_phone: "Mobile Phone",
    date_of_hire: "Date of Hire",
    gender: "Gender",
    self_id: "Ethnicity",
    home_phone: "Home Phone",
    date_of_birth: "Date of Birth",
    address_line2: "Address Line 2",
  };

  return (
    fieldMap[field] ||
    field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
};
