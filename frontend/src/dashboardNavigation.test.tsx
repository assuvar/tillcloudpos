import { describe, expect, it } from 'vitest';
import { getAccessibleDashboardViews } from './dashboardNavigation';

describe('Dashboard navigation permission visibility', () => {
  it('shows allowed modules and hides restricted modules', () => {
    const views = getAccessibleDashboardViews('CASHIER', (group) => {
      return group === 'BILLING';
    });

    const labels = views.map((view) => view.label);
    expect(labels).toContain('Orders');
    expect(labels).not.toContain('Reports');
  });
});
