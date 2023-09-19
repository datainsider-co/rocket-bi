export enum PlanType {
  Startup = 'startup_plan',
  Business = 'business_plan',
  Cooperate = 'cooperate_plan',
  OnPremise = 'OnPremise',
  NoPlan = 'NoPlan',
  Trial = 'trial_plan'
}

export const PlanTypeIcon: Record<PlanType, string> = {
  [PlanType.Startup]: 'paper-plane.svg',
  [PlanType.Business]: 'airplane.svg',
  [PlanType.Cooperate]: 'shuttle.svg',
  [PlanType.OnPremise]: 'ufo.svg',
  [PlanType.NoPlan]: 'paper-plane.svg',
  [PlanType.Trial]: 'paper-plane.svg'
};

export const PlanTypeBgColors: Record<PlanType, [string, string]> = {
  [PlanType.Startup]: ['#5950dc', '#2d27b6'],
  [PlanType.Business]: ['#3679ce', '#1944a0'],
  [PlanType.Cooperate]: ['#2aa6ce', '#136da0'],
  [PlanType.OnPremise]: ['#9132e3', '#5817c4'],
  [PlanType.NoPlan]: ['#0000080', '#0000080'],
  [PlanType.Trial]: ['#0000080', '#0000080']
};

export const PlanDisplayNames: Record<PlanType, string> = {
  [PlanType.Startup]: 'Startup',
  [PlanType.Business]: 'Business',
  [PlanType.Cooperate]: 'Corporate',
  [PlanType.OnPremise]: 'On Premise',
  [PlanType.NoPlan]: 'No Plan',
  [PlanType.Trial]: 'Trial'
};

export const PlanDescriptions: Record<PlanType, string> = {
  [PlanType.Startup]: 'Best for freelancers, small teams',
  [PlanType.Business]: 'Best for medium size teams',
  [PlanType.Cooperate]: 'Best for freelancers, small teams',
  [PlanType.OnPremise]: 'Best for medium size teams',
  [PlanType.NoPlan]: '--',
  [PlanType.Trial]: 'Trial'
};
