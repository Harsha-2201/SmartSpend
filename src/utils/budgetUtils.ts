export type BudgetStatusType = 'Normal' | 'Warning' | 'Critical' | 'Exceeded';

export interface BudgetStatus {
  status: BudgetStatusType;
  color: 'emerald' | 'amber' | 'orange' | 'rose';
  backgroundColor: string; // Tailwind class for light badge background
  textColor: string;       // Tailwind class for badge text
  barColor: string;        // Tailwind class for progress bar
  showDeficit: boolean;
  badgeText: string;
}

/**
 * Reusable dynamic status calculator for budget utilization percentage.
 * 
 * Rules:
 * 1. Below 75%  (< 75)        -> Normal   (Emerald green)
 * 2. 75% to 89.99% (>= 75 && < 90) -> Warning  (Amber / yellow)
 * 3. 90% to 100% (>= 90 && <= 100) -> Critical (Orange)
 * 4. Above 100% (> 100)       -> Exceeded (Deep red / rose)
 */
export function getBudgetStatus(utilizationPercentage: number): BudgetStatus {
  if (utilizationPercentage < 75) {
    return {
      status: 'Normal',
      color: 'emerald',
      backgroundColor: 'bg-emerald-100',
      textColor: 'text-emerald-700',
      barColor: 'bg-emerald-500',
      showDeficit: false,
      badgeText: 'Normal'
    };
  } else if (utilizationPercentage < 90) {
    return {
      status: 'Warning',
      color: 'amber',
      backgroundColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      barColor: 'bg-amber-500',
      showDeficit: false,
      badgeText: 'Warning'
    };
  } else if (utilizationPercentage <= 100) {
    return {
      status: 'Critical',
      color: 'orange',
      backgroundColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      barColor: 'bg-orange-500',
      showDeficit: false,
      badgeText: 'Critical'
    };
  } else {
    return {
      status: 'Exceeded',
      color: 'rose',
      backgroundColor: 'bg-rose-100',
      textColor: 'text-rose-700',
      barColor: 'bg-rose-600',
      showDeficit: true,
      badgeText: 'Exceeded'
    };
  }
}

export interface BudgetUtilizationCalculation {
  hasBudget: boolean;
  monthlyBudget: number;
  totalSpent: number;
  utilizationPercentage: number;
  formattedPercentage: string;
  barWidth: number;
  deficit: number;
  statusInfo: BudgetStatus | null;
}

/**
 * Single source of truth for budget utilization calculation.
 * Handles edge cases:
 * - monthlyBudget = 0 or null -> "No budget set", 0% bar, no division by zero
 * - totalSpent = 0 -> 0%, Normal, Emerald bar
 * - totalSpent > monthlyBudget -> Exceeded, bar clamped to 100%, deficit calculated
 * - decimal precision -> rounded to 1 decimal place (or 2 if needed for 89.99%)
 */
export function calculateBudgetUtilization(
  monthlyBudget: number | null | undefined,
  totalSpent: number | null | undefined
): BudgetUtilizationCalculation {
  const safeBudget = monthlyBudget !== null && monthlyBudget !== undefined ? Math.max(0, monthlyBudget) : 0;
  const safeSpent = totalSpent !== null && totalSpent !== undefined ? Math.max(0, totalSpent) : 0;

  if (safeBudget <= 0) {
    return {
      hasBudget: false,
      monthlyBudget: 0,
      totalSpent: safeSpent,
      utilizationPercentage: 0,
      formattedPercentage: '0%',
      barWidth: 0,
      deficit: safeSpent,
      statusInfo: null
    };
  }

  // Exact utilization percentage
  const utilizationPercentage = (safeSpent / safeBudget) * 100;
  const statusInfo = getBudgetStatus(utilizationPercentage);
  // Bar width must never exceed 100%
  const barWidth = Math.min(utilizationPercentage, 100);
  const deficit = Math.max(0, safeSpent - safeBudget);

  // Format display: 1 decimal place (e.g., 42.5%), preserving up to 2 decimals if needed (e.g., 89.99%)
  let formattedPercentage = '';
  if (utilizationPercentage % 1 === 0) {
    formattedPercentage = `${utilizationPercentage.toFixed(0)}%`;
  } else {
    // If it's something like 42.5 or 89.99
    const formattedNum = Number(utilizationPercentage.toFixed(2));
    formattedPercentage = `${formattedNum}%`;
  }

  return {
    hasBudget: true,
    monthlyBudget: safeBudget,
    totalSpent: safeSpent,
    utilizationPercentage,
    formattedPercentage,
    barWidth,
    deficit,
    statusInfo
  };
}
