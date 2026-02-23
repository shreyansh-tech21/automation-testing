const {chromium}=require('playwright');
const path=require('path');
const fs=require('fs');
const selfHeal=require('./utils/selfHeal');

async function runTest(test) {
    const results = [];
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(test.url, { waitUntil: "domcontentloaded" });

    for (const step of test.steps) {
        let stepResult = {
            label: step.label,
            status: "Passed",
            error: "",
            screenshot: ""
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
                await healResult.element.click();

                stepResult.healed = healResult.strategy !== "label";
                stepResult.healStrategy = healResult.strategy;
                stepResult.similarityScore = healResult.score;
            }
            // Steps with only "expected" (no action) are assertion-only; wait for text then check
            if (step.expected) {
                // Wait for the expected text to appear (page may still be loading after click/navigation)
                try {
                    await page.getByText(step.expected, { exact: false }).first().waitFor({ state: 'visible', timeout: 10000 });
                } catch (waitErr) {
                    const bodyText = await page.locator('body').innerText();
                    throw new Error(`Expected "${step.expected}" not found on page (waited 10s). Page text (first 300 chars): ${bodyText.slice(0, 300)}`);
                }
                const textFound = await page.locator('body').innerText();
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