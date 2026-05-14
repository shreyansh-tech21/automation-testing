const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const selfHeal = require("./utils/selfHeal");

/**
 * @param {object} test - Test document with url, steps
 * @param {{ onStepComplete?: (stepResult: object) => Promise<void> }} [opts] - Optional: called after each step for live updates
 */
async function runTest(test, opts = {}) {
    const url = test.url && String(test.url).trim();
    if (!url) {
        throw new Error("UI test has no start URL. Add a 'url' to the test or use testType 'api' for API tests.");
    }
    const results = [];
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded" });

    for (const step of test.steps) {
        let stepResult = {
            label: step.label,
            status: "Passed",
            error: "",
            screenshot: "",
            action: step.action,
            filledValue: step.action === "fill" && step.value != null ? String(step.value) : undefined,
            expected: step.expected,
            type: step.type
        };
        try {
            if (step.action === "fill") {
                const healResult = await selfHeal(page, step);
                await healResult.element.fill(step.value);
                stepResult.healed = healResult.strategy !== "label";
                stepResult.healStrategy = healResult.strategy;
                stepResult.similarityScore = healResult.score;
                if (stepResult.healed) {
                    console.log(`Self-healing: Found "${step.label}" using ${healResult.strategy}`);
                }
            } else if (step.action === "click") {
                const healResult = await selfHeal(page, step);
                await Promise.all([
                    page.waitForLoadState("domcontentloaded").catch(() => {}),
                    healResult.element.click()
                ]);
                stepResult.healed = healResult.strategy !== "label";
                stepResult.healStrategy = healResult.strategy;
                stepResult.similarityScore = healResult.score;
            } else if (step.action === "assert" || (step.expected && step.action !== "fill" && step.action !== "click")) {
                // Assert step: only check if expected text is present on the page (no element lookup by label)
                if (!step.expected || !step.expected.trim()) {
                    throw new Error("Assert step requires 'expected' text to check");
                }
                const expectedText = step.expected.trim();
                try {
                    await page.getByText(expectedText, { exact: false }).first().waitFor({ state: "visible", timeout: 10000 });
                } catch (waitErr) {
                    const bodyText = await page.locator("body").innerText();
                    throw new Error(`Expected text "${expectedText}" not found on page (waited 10s). Page text (first 300 chars): ${bodyText.slice(0, 300)}`);
                }
                const textFound = await page.locator("body").innerText();
                if (!textFound.includes(expectedText)) {
                    throw new Error(`Expected text "${expectedText}" not found in the page`);
                }
            }
            if (step.expected && (step.action === "fill" || step.action === "click")) {
                // After fill/click: check expected text
                try {
                    await page.getByText(step.expected, { exact: false }).first().waitFor({ state: "visible", timeout: 10000 });
                } catch (waitErr) {
                    const bodyText = await page.locator("body").innerText();
                    throw new Error(`Expected "${step.expected}" not found on page (waited 10s). Page text (first 300 chars): ${bodyText.slice(0, 300)}`);
                }
                const textFound = await page.locator("body").innerText();
                if (!textFound.includes(step.expected)) {
                    throw new Error(`Expected "${step.expected}" not found in the page`);
                }
            }
        } catch (err) {
            stepResult.status = "Failed";
            stepResult.error = err.message;
            const screenshotsDir = path.join(__dirname, "screenshots");
            try {
                fs.mkdirSync(screenshotsDir, { recursive: true });
                const screenshotPath = path.join(screenshotsDir, `${Date.now()}-${(step.label || "step").replace(/[^a-z0-9_-]/gi, "_")}.png`);
                await page.screenshot({ path: screenshotPath });
                stepResult.screenshot = screenshotPath;
            } catch (screenErr) {
                stepResult.screenshot = "(screenshot failed: " + screenErr.message + ")";
            }
        } finally {
            results.push(stepResult);
            if (opts.onStepComplete) {
                await Promise.resolve(opts.onStepComplete(stepResult));
            }
        }
    }
    const overallStatus=results.every(result=>result.status==="Passed")?"Passed":"Failed";
    await browser.close();
    return {
        results,
        overallStatus
    }
}

module.exports = { runTest };