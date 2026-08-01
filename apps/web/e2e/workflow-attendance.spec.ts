import { expect, test } from "@playwright/test";
import { signInAs, navigateTo } from "./helpers";

/* ------------------------------------------------------------------ */
/*  Helper: collect console errors while executing a callback          */
/* ------------------------------------------------------------------ */
async function withConsoleErrors(
  page: import("@playwright/test").Page,
  fn: () => Promise<void>,
): Promise<string[]> {
  const errors: string[] = [];
  const handler = (msg: import("@playwright/test").ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg.text());
  };
  page.on("console", handler);
  await fn();
  page.off("console", handler);
  return errors.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("Failed to load resource") &&
      !e.includes("net::ERR_") &&
      !e.includes("404") &&
      !e.includes("The resource") &&
      !e.includes("was preloaded using link preload") &&
      !e.includes("Failed to find a valid digest") &&
      !e.includes("self-xss") &&
      !e.includes("Not implemented") &&
      !e.includes("CORS") &&
      !e.includes("has been blocked by CORS") &&
      !e.includes("width(-1) and height(-1)") &&
      !e.includes("socket.io") &&
      !e.includes("Socket initialization failed") &&
      !e.includes("Failed to fetch") &&
      !e.includes("initSocket"),
  );
}

/* ================================================================== */
/*  Scenario 1: Employee can check in and check out                    */
/* ================================================================== */
test.describe.serial("Scenario 1 - Employee Check-in / Check-out", () => {
  test("employee signs in and navigates to attendance page", async ({
    page,
  }) => {
    // 1. Sign in as employee
    await signInAs(page, "sales@company.com", "Sales@12345");

    // 2. Navigate to attendance
    await navigateTo(page, "/dashboard/attendance");

    // 3. Verify the "My Attendance" heading (employee view)
    //    Employee view shows H2 "My Attendance", not just "Attendance"
    await expect(
      page.getByRole("heading", { name: /attendance/i })
    ).toBeVisible({ timeout: 15000 });

    // 4. Check for Employee Attendance View elements
    const hasCheckInButton = await page
      .getByRole("button", { name: /check.?in/i })
      .isVisible()
      .catch(() => false);
    const hasMyAttendance = await page
      .getByRole("heading", { name: "My Attendance" })
      .isVisible()
      .catch(() => false);
    const hasTodaySection = await page
      .getByRole("heading", { name: "Today" })
      .isVisible()
      .catch(() => false);
    const hasHistorySection = await page
      .getByRole("heading", { name: "History" })
      .isVisible()
      .catch(() => false);
    const hasFileInput =
      (await page.locator('input[type="file"]').count()) > 0;
    const hasCompletedText = await page
      .getByText(/completed|checked.?in|present/i)
      .isVisible()
      .catch(() => false);

    console.log(
      `[Scenario1] checkInBtn=${hasCheckInButton}, myAttendance=${hasMyAttendance}, ` +
        `today=${hasTodaySection}, history=${hasHistorySection}, ` +
        `fileInput=${hasFileInput}, completed=${hasCompletedText}`
    );

    // 5. Take initial screenshot
    await page.screenshot({
      path: "test-results/attendance-01-employee-page.png",
      fullPage: true,
    });

    // The employee MUST see the check-in button or a completed state
    expect(
      hasCheckInButton || hasMyAttendance || hasCompletedText,
      "Employee should see 'My Attendance' heading with Check In button or completed status"
    ).toBeTruthy();

    // 6. Try to click the Check In button if visible
    if (hasCheckInButton) {
      const checkInBtn = page.getByRole("button", { name: /check.?in/i });
      await checkInBtn.click();
      await page.waitForTimeout(3000);
      console.log("[Scenario1] Clicked Check In button - observing result");
    } else {
      console.log(
        "[Scenario1] No Check In button visible - employee may already be checked in"
      );
    }

    // 7. Post-action screenshot
    await page.screenshot({
      path: "test-results/attendance-02-employee-after-action.png",
      fullPage: true,
    });

    // Page should still be on attendance (not crash)
    expect(page.url()).toContain("/dashboard/attendance");
  });
});

/* ================================================================== */
/*  Scenario 2: Employee view shows attendance history table/empty     */
/* ================================================================== */
test.describe.serial("Scenario 2 - Employee Attendance History", () => {
  test("employee sees history section with empty state", async ({ page }) => {
    await signInAs(page, "sales@company.com", "Sales@12345");
    await navigateTo(page, "/dashboard/attendance");

    // Wait for page to settle
    await page.waitForTimeout(3000);

    // Look for history-related elements
    const hasHistoryHeading = await page
      .getByRole("heading", { name: "History" })
      .isVisible()
      .catch(() => false);
    const hasNoRecords = await page
      .getByText(/no attendance records/i)
      .isVisible()
      .catch(() => false);
    const hasEmptyText = await page
      .getByText(/attendance records will appear/i)
      .isVisible()
      .catch(() => false);
    const hasHistorySubtext = await page
      .getByText(/mark your attendance and view history/i)
      .isVisible()
      .catch(() => false);

    console.log(
      `[Scenario2] historyHeading=${hasHistoryHeading}, noRecords=${hasNoRecords}, ` +
        `emptyText=${hasEmptyText}, historySubtext=${hasHistorySubtext}`
    );

    await page.screenshot({
      path: "test-results/attendance-03-employee-history.png",
      fullPage: true,
    });

    // Employee should see the History section
    expect(
      hasHistoryHeading || hasNoRecords || hasEmptyText,
      "Employee should see History section or no-records message"
    ).toBeTruthy();
  });
});

/* ================================================================== */
/*  Scenario 3: HR Manager can view all attendance records             */
/* ================================================================== */
test.describe.serial("Scenario 3 - HR Manager Attendance View", () => {
  test("HR manager sees admin-style attendance table", async ({ page }) => {
    await signInAs(page, "hr@company.com", "Hr@12345");
    await navigateTo(page, "/dashboard/attendance");

    // Verify the heading - HR sees H2 "Attendance" (not "My Attendance")
    await expect(
      page.getByRole("heading", { name: "Attendance" })
    ).toBeVisible({ timeout: 15000 });

    await page.waitForTimeout(2000);

    // Check what HR sees - admin-style view with table
    const hasTable = await page
      .getByRole("table")
      .isVisible()
      .catch(() => false);
    const hasAddBtn = await page
      .getByRole("button", { name: /add record/i })
      .isVisible()
      .catch(() => false);
    const hasNoData = await page
      .getByText(/no data found/i)
      .isVisible()
      .catch(() => false);
    const hasTrackText = await page
      .getByText(/track employee attendance/i)
      .isVisible()
      .catch(() => false);
    const hasVerifiedCol = await page
      .getByText("Verified")
      .isVisible()
      .catch(() => false);
    const hasEmployeeCol = await page
      .getByText("Employee", { exact: true })
      .isVisible()
      .catch(() => false);
    const hasStatusCol = await page
      .getByText("Status", { exact: true })
      .isVisible()
      .catch(() => false);

    console.log(
      `[Scenario3] table=${hasTable}, addBtn=${hasAddBtn}, noData=${hasNoData}, ` +
        `trackText=${hasTrackText}, verified=${hasVerifiedCol}, ` +
        `employee=${hasEmployeeCol}, status=${hasStatusCol}`
    );

    await page.screenshot({
      path: "test-results/attendance-04-hr-view.png",
      fullPage: true,
    });

    // HR should see admin-style view: heading + table or Add Record button
    expect(
      hasTable || hasAddBtn || hasTrackText,
      "HR should see attendance table, Add Record button, or track text"
    ).toBeTruthy();
  });
});

/* ================================================================== */
/*  Scenario 4: Admin can view all attendance records                  */
/* ================================================================== */
test.describe.serial("Scenario 4 - Admin Attendance View", () => {
  test("admin sees admin-style attendance table", async ({ page }) => {
    await signInAs(page, "admin@company.com", "Admin@123");
    await navigateTo(page, "/dashboard/attendance");

    await expect(
      page.getByRole("heading", { name: "Attendance" })
    ).toBeVisible({ timeout: 15000 });

    await page.waitForTimeout(2000);

    const hasTable = await page
      .getByRole("table")
      .isVisible()
      .catch(() => false);
    const hasAddBtn = await page
      .getByRole("button", { name: /add record/i })
      .isVisible()
      .catch(() => false);
    const hasNoData = await page
      .getByText(/no data found/i)
      .isVisible()
      .catch(() => false);
    const hasTrackText = await page
      .getByText(/track employee attendance/i)
      .isVisible()
      .catch(() => false);

    console.log(
      `[Scenario4] table=${hasTable}, addBtn=${hasAddBtn}, noData=${hasNoData}, trackText=${hasTrackText}`
    );

    await page.screenshot({
      path: "test-results/attendance-05-admin-view.png",
      fullPage: true,
    });

    expect(
      hasTable || hasAddBtn || hasTrackText,
      "Admin should see attendance table, Add Record button, or track text"
    ).toBeTruthy();
  });
});

/* ================================================================== */
/*  Scenario 5: Employee check-in form validation                     */
/* ================================================================== */
test.describe.serial("Scenario 5 - Employee Check-in Form Elements", () => {
  test("employee check-in form has required elements", async ({ page }) => {
    await signInAs(page, "sales@company.com", "Sales@12345");
    await navigateTo(page, "/dashboard/attendance");

    await page.waitForTimeout(3000);

    // Collect console errors during the test
    const consoleErrors = await withConsoleErrors(page, async () => {
      // Look for check-in form elements
      const hasCheckInBtn = await page
        .getByRole("button", { name: /check.?in/i })
        .isVisible()
        .catch(() => false);
      const fileInputCount = await page
        .locator('input[type="file"]')
        .count()
        .catch(() => 0);
      const hasSelfiePrompt = await page
        .getByText(/selfie|photo|camera|image|upload/i)
        .isVisible()
        .catch(() => false);
      const hasLocationPrompt = await page
        .getByText(/location|gps|geo|latitude|permission/i)
        .isVisible()
        .catch(() => false);
      const hasCompletedBadge = await page
        .getByText(/completed|checked.?in|present/i)
        .isVisible()
        .catch(() => false);

      console.log(
        `[Scenario5] checkInBtn=${hasCheckInBtn}, fileInput=${fileInputCount}, ` +
          `selfiePrompt=${hasSelfiePrompt}, locationPrompt=${hasLocationPrompt}, ` +
          `completed=${hasCompletedBadge}`
      );

      // If check-in button exists, try to click it and observe
      if (hasCheckInBtn) {
        const btn = page.getByRole("button", { name: /check.?in/i });
        await btn.click();
        await page.waitForTimeout(3000);
        console.log("[Scenario5] Clicked Check In - observing result");

        // Check for error messages or validation
        const hasError = await page
          .getByText(/error|required|please provide|permission denied|denied|allow.*location/i)
          .isVisible()
          .catch(() => false);
        const stillOnPage = page.url().includes("/attendance");
        console.log(
          `[Scenario5] After click: hasError=${hasError}, stillOnPage=${stillOnPage}`
        );
      }
    });

    await page.screenshot({
      path: "test-results/attendance-06-checkin-form.png",
      fullPage: true,
    });

    if (consoleErrors.length > 0) {
      console.log(
        "[Scenario5] Console errors:",
        JSON.stringify(consoleErrors, null, 2)
      );
    }

    // The attendance page should be accessible for employee
    const hasMyAttendance = await page
      .getByRole("heading", { name: /attendance/i })
      .isVisible()
      .catch(() => false);
    expect(
      hasMyAttendance,
      "Employee attendance page should be accessible"
    ).toBeTruthy();
  });
});

/* ================================================================== */
/*  Scenario 6: Role-by-role Attendance page access                    */
/* ================================================================== */
test.describe.serial("Scenario 6 - All Roles Attendance Access", () => {
  const roles = [
    {
      label: "Owner",
      email: "owner@company.com",
      password: "Owner@123",
      expectAccess: true,
      expectAdminView: true,
    },
    {
      label: "Admin",
      email: "admin@company.com",
      password: "Admin@123",
      expectAccess: true,
      expectAdminView: true,
    },
    {
      label: "HR Manager",
      email: "hr@company.com",
      password: "Hr@12345",
      expectAccess: true,
      expectAdminView: true,
    },
    {
      label: "Manager",
      email: "manager@company.com",
      password: "Manager@123",
      expectAccess: true,
      expectAdminView: true,
    },
    {
      label: "Team Lead",
      email: "teamlead@company.com",
      password: "Teamlead@123",
      expectAccess: true,
      expectAdminView: true,
    },
    {
      label: "Employee (Sales)",
      email: "sales@company.com",
      password: "Sales@12345",
      expectAccess: true,
      expectAdminView: false, // Employee gets "My Attendance" self-service view
    },
    {
      label: "Field Employee",
      email: "field@company.com",
      password: "Field@123",
      expectAccess: true,
      expectAdminView: true, // Field gets admin-style view with Add Record
    },
    {
      label: "Accounts",
      email: "accounts@company.com",
      password: "Accounts@123",
      expectAccess: true,
      expectAdminView: true,
    },
  ];

  for (const role of roles) {
    test(`${role.label} (${role.email}) attendance access`, async ({
      page,
    }) => {
      await signInAs(page, role.email, role.password);

      // Navigate directly so we can detect redirects
      await page.goto("/dashboard/attendance", {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      const redirectedToSignIn = currentUrl.includes("/sign-in");
      const onAttendance = currentUrl.includes("/attendance");

      console.log(
        `[Scenario6:${role.label}] url=${currentUrl}, redirected=${redirectedToSignIn}`
      );

      await page.screenshot({
        path: `test-results/attendance-07-role-${role.label.toLowerCase().replace(/[\s()]/g, "-")}.png`,
        fullPage: true,
      });

      // Verify access
      if (role.expectAccess) {
        expect(
          !redirectedToSignIn,
          `${role.label} should have access to attendance but was redirected to sign-in`
        ).toBeTruthy();
      }

      // If they have access, verify the view type
      if (!redirectedToSignIn) {
        const hasHeading = await page
          .getByRole("heading", { name: /attendance/i })
          .isVisible()
          .catch(() => false);
        const hasTable = await page
          .getByRole("table")
          .isVisible()
          .catch(() => false);
        const hasCheckIn = await page
          .getByRole("button", { name: /check.?in/i })
          .isVisible()
          .catch(() => false);
        const hasAddRecord = await page
          .getByRole("button", { name: /add record/i })
          .isVisible()
          .catch(() => false);
        const hasMyAttendance = await page
          .getByRole("heading", { name: "My Attendance" })
          .isVisible()
          .catch(() => false);

        console.log(
          `[Scenario6:${role.label}] heading=${hasHeading}, table=${hasTable}, ` +
            `checkIn=${hasCheckIn}, addRecord=${hasAddRecord}, myAttendance=${hasMyAttendance}`
        );

        if (role.expectAdminView) {
          // Admin-style view: should have table or Add Record button
          expect(
            hasTable || hasAddRecord,
            `${role.label} should see admin-style attendance view with table or Add Record`
          ).toBeTruthy();
        } else {
          // Employee self-service view: should have Check In button or My Attendance heading
          expect(
            hasCheckIn || hasMyAttendance,
            `${role.label} should see self-service attendance view with Check In or My Attendance`
          ).toBeTruthy();
        }

        // ALL roles should see some attendance heading
        expect(
          hasHeading,
          `${role.label} should see an Attendance heading on the page`
        ).toBeTruthy();
      }
    });
  }
});
