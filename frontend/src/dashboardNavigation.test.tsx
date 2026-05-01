import { describe, expect, it } from "vitest";
import {
  DASHBOARD_VIEWS,
  getAccessibleDashboardViews,
} from "./dashboardNavigation";

describe("Dashboard navigation permission visibility", () => {
  it("shows all modules for all roles", () => {
    const views = getAccessibleDashboardViews("CASHIER", (group) => {
      return group === "BILLING";
    });

    expect(views.map((view) => view.id)).toEqual(
      DASHBOARD_VIEWS.map((view) => view.id),
    );
  });
});
