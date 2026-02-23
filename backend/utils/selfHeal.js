const stringSimilarity = require('string-similarity');

async function selfHeal(page, step) {
    const labelLower = (step.label || '').toLowerCase();

    // S0 = Button or link by role (so "Login" hits the submit button, not the "Login" in "Login Page" heading)
    try {
        const btn = page.getByRole('button', { name: step.label });
        await btn.first().waitFor({ timeout: 2000 });
        return { element: btn.first(), strategy: 'button', score: 1 };
    } catch (_) {}
    try {
        const link = page.getByRole('link', { name: step.label });
        await link.first().waitFor({ timeout: 2000 });
        return { element: link.first(), strategy: 'link', score: 1 };
    } catch (_) {}

    // S1 = Use Label (exact)
    try {
        const el = page.getByLabel(step.label);
        await el.first().waitFor({ timeout: 2000 });
        return { element: el.first(), strategy: 'label', score: 1 };
    } catch (_) {}

    // S2 = Use Placeholder
    try {
        const el = page.getByPlaceholder(step.label);
        await el.first().waitFor({ timeout: 2000 });
        return { element: el.first(), strategy: 'placeholder', score: 0.9 };
    } catch (_) {}

    // S3 = Use Text (fallback for buttons/links; can match wrong element e.g. "Login" in "Login Page")
    try {
        const el = page.getByText(step.label);
        await el.first().waitFor({ timeout: 2000 });
        return { element: el.first(), strategy: 'text', score: 0.8 };
    } catch (_) {}

    // S4 = Fuzzy match: compare "User Name" with input name/id/placeholder/label
    const allInputs = await page.locator('input').all();
    let bestMatch = null;
    let highestScore = 0;

    for (const input of allInputs) {
        const name = (await input.getAttribute('name')) || '';
        const id = (await input.getAttribute('id')) || '';
        const placeholder = (await input.getAttribute('placeholder')) || '';
        const ariaLabel = (await input.getAttribute('aria-label')) || '';

        const candidates = [name, id, placeholder, ariaLabel].filter(Boolean).map(s => s.toLowerCase());
        for (const candidate of candidates) {
            const score = stringSimilarity.compareTwoStrings(labelLower, candidate);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = input;
            }
        }
        // Also compare with normalized label: "User Name" -> "username" vs "username"
        const normalizedLabel = labelLower.replace(/\s+/g, '');
        const scoreNorm = stringSimilarity.compareTwoStrings(normalizedLabel, (name || id).toLowerCase());
        if (scoreNorm > highestScore) {
            highestScore = scoreNorm;
            bestMatch = input;
        }
    }

    if(highestScore>0.6 && bestMatch){
        return {element:bestMatch,strategy:"fuzzy",score:highestScore};
    }

    throw new Error(`Element not found even after self-healing strategies for "${step.label}"`);
}

module.exports=selfHeal;