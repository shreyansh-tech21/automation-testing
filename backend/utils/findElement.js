async function findElement(page, label, timeout = 5000) {
    const selectors = [
      `[data-testid="${label}"]`,
      `#${label}`,
      `[name="${label}"]`,
      `[placeholder="${label}"]`,
      `text=${label}`
    ];
  
    const start = Date.now();
  
    while (Date.now() - start < timeout) {
      for (const selector of selectors) {
        const el = await page.$(selector);
        if (el) return el;
      }
  
      await page.waitForTimeout(300);
    }
  
    throw new Error(`Element not found for label: ${label}`);
  }
  
  module.exports = findElement;