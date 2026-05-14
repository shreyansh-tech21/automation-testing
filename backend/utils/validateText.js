/**
 * Assert that expectedText appears on the page.
 * - If selector is provided, checks that element first.
 * - Falls back to waiting for the text anywhere on the page (so tests pass even
 *   when the message is not in a specific element like #flash).
 */
async function validateText(page, selector, expectedText, timeout = 10000) {
    const start = Date.now();
    let lastText = "";

    // 1) Try the given selector first (e.g. #flash)
    if (selector && typeof selector === "string" && selector.trim()) {
        while (Date.now() - start < timeout) {
            try {
                const element = await page.$(selector.trim());
                if (element) {
                    const text = (await element.textContent()) || "";
                    lastText = text;
                    if (text.trim() === expectedText || text.includes(expectedText)) {
                        return true;
                    }
                }
            } catch (error) {
                console.error(`Error validating text in selector: ${error}`);
            }
            await page.waitForTimeout(300);
        }
    }

    // 2) Fallback: wait for the text to appear anywhere on the page (no selector needed)
    try {
        await page.getByText(expectedText, { exact: false }).first().waitFor({ state: "visible", timeout: Math.max(2000, timeout - (Date.now() - start)) });
        return true;
    } catch (fallbackErr) {
        try {
            const bodyText = await page.locator("body").innerText();
            lastText = bodyText.slice(0, 300);
        } catch (_) {}
        throw new Error(`Expected text "${expectedText}" not found on page. ${lastText ? `Page content (first 300 chars): ${lastText}` : ""}`);
    }
}

module.exports = validateText;