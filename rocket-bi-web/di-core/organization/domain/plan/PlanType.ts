export enum PlanType {
  Starter = 'Starter',
  Professional = 'Professional',
  Enterprise = 'Enterprise',
  OnPremise = 'OnPremise',
  NoPlan = 'NoPlan',
  Trial = 'Trial'
}

export const PlanTypeIcon: Record<PlanType, string> = {
  [PlanType.Starter]: 'paper-plane.svg',
  [PlanType.Professional]: 'airplane.svg',
  [PlanType.Enterprise]: 'shuttle.svg',
  [PlanType.OnPremise]: 'ufo.svg',
  [PlanType.NoPlan]: 'paper-plane.svg',
  [PlanType.Trial]: 'paper-plane.svg'
};

export const PlanTypeBgColors: Record<PlanType, [string, string]> = {
  [PlanType.Starter]: ['#5950dc', '#2d27b6'],
  [PlanType.Professional]: ['#3679ce', '#1944a0'],
  [PlanType.Enterprise]: ['#2aa6ce', '#136da0'],
  [PlanType.OnPremise]: ['#9132e3', '#5817c4'],
  [PlanType.NoPlan]: ['#0000080', '#0000080'],
  [PlanType.Trial]: ['#0000080', '#0000080']
};

export const PlanPrice: Record<PlanType, string> = {
  [PlanType.Starter]: '$45/mo',
  [PlanType.Professional]: '$800/mo',
  [PlanType.Enterprise]: '$1200/mo',
  [PlanType.OnPremise]: '$3000/mo',
  [PlanType.NoPlan]: '--',
  [PlanType.Trial]: '--'
};
export const PlanFeatures: Record<PlanType, string[]> = {
  [PlanType.Starter]: ['Access to', 'Core reports (including Flows)', 'Data dictionary'],
  [PlanType.Professional]: ['All features in Starter, plus', 'Unlimited saved reports & cohorts', 'Data modeling'],
  [PlanType.Enterprise]: ['All features in Professional, plus', 'Core reports (including Flows)', 'Data dictionary'],
  [PlanType.OnPremise]: ['All features in Enterprise, plus', 'Unlimited saved reports & cohorts', 'Data modeling'],
  [PlanType.NoPlan]: [],
  [PlanType.Trial]: []
};
