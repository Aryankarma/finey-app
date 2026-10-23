import type { CategoryKey } from '@/data/seed';
import type { IconName } from '@/ui/icons';
import { categoryColors } from '@/ui/theme';

export const categories: Record<CategoryKey, { label: string; color: string; icon: IconName }> = {
  food: { label: 'Food & Dining', color: categoryColors.food, icon: 'food' },
  transport: { label: 'Transportation', color: categoryColors.transport, icon: 'transport' },
  utilities: { label: 'Utilities', color: categoryColors.utilities, icon: 'utilities' },
  shopping: { label: 'Shopping', color: categoryColors.shopping, icon: 'shopping' },
  entertainment: { label: 'Entertainment', color: categoryColors.entertainment, icon: 'entertainment' },
  health: { label: 'Health', color: categoryColors.health, icon: 'health' },
  education: { label: 'Education', color: categoryColors.education, icon: 'education' },
  other: { label: 'Other', color: categoryColors.other, icon: 'other' },
  salary: { label: 'Salary', color: categoryColors.income, icon: 'salary' },
  freelance: { label: 'Freelance', color: categoryColors.income, icon: 'freelance' },
  bonus: { label: 'Bonus', color: categoryColors.income, icon: 'bonus' },
  investment: { label: 'Investment', color: categoryColors.income, icon: 'investment' },
};

// Chip order on New entry. "Other" is offered for both kinds.
export const expenseCategories: CategoryKey[] = ['food', 'transport', 'utilities', 'shopping', 'entertainment', 'health', 'education', 'other'];
export const incomeCategories: CategoryKey[] = ['salary', 'freelance', 'bonus', 'investment', 'other'];
