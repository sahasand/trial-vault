export const NCT_ID_PATTERN = /^NCT\d{8,11}$/i;

export interface CtgovTrialData {
  trialName: string;
  phase: string;
  sampleSize: number;
  indication: string;
  sponsor: string;
  primaryEndpoint: string;
  status: string;
}

export interface CtgovSearchResult {
  nctId: string;
  trialName: string;
  phase: string;
  sponsor: string;
  status: string;
}

const PHASE_MAP: Record<string, string> = {
  PHASE1: "I",
  PHASE2: "II",
  PHASE3: "III",
  PHASE4: "IV",
  NA: "N/A",
};

const STATUS_MAP: Record<string, string> = {
  RECRUITING: "Recruiting",
  ACTIVE_NOT_RECRUITING: "Active",
  ENROLLING_BY_INVITATION: "Recruiting",
  NOT_YET_RECRUITING: "Recruiting",
  COMPLETED: "Completed",
  TERMINATED: "Terminated",
  SUSPENDED: "Terminated",
  WITHDRAWN: "Terminated",
};

function mapPhase(phases?: string[]): string {
  if (!phases || phases.length === 0) return "";
  const mapped = phases.map((p) => PHASE_MAP[p]).filter(Boolean);
  return mapped[mapped.length - 1] ?? "";
}

function mapStatus(overallStatus?: string): string {
  if (!overallStatus) return "";
  return STATUS_MAP[overallStatus] ?? "Unknown";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapCtgovToTrial(apiResponse: any): CtgovTrialData {
  const proto = apiResponse?.protocolSection;
  if (!proto) {
    throw new Error("Invalid API response structure");
  }

  const identification = proto.identificationModule;
  const design = proto.designModule;
  const conditions = proto.conditionsModule;
  const sponsors = proto.sponsorCollaboratorsModule;
  const outcomes = proto.outcomesModule;
  const statusModule = proto.statusModule;

  return {
    trialName: identification?.briefTitle ?? "",
    phase: mapPhase(design?.phases),
    sampleSize: design?.enrollmentInfo?.count ?? 0,
    indication: (conditions?.conditions ?? []).join(", "),
    sponsor: sponsors?.leadSponsor?.name ?? "",
    primaryEndpoint: outcomes?.primaryOutcomes?.[0]?.measure ?? "",
    status: mapStatus(statusModule?.overallStatus),
  };
}

export function mapCtgovToSearchResult(study: any): CtgovSearchResult {
  const proto = study?.protocolSection;
  if (!proto) {
    throw new Error("Invalid study structure");
  }

  return {
    nctId: proto.identificationModule?.nctId ?? "",
    trialName: proto.identificationModule?.briefTitle ?? "",
    phase: mapPhase(proto.designModule?.phases),
    sponsor: proto.sponsorCollaboratorsModule?.leadSponsor?.name ?? "",
    status: mapStatus(proto.statusModule?.overallStatus),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
