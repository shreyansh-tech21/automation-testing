# Project review – why failures weren’t triggering screenshots

## What was going wrong

1. **Screenshots folder never created**  
   The runner wrote screenshots to `backend/screenshots/`. That directory was never created. When Playwright tried to save the PNG, it threw (e.g. ENOENT). That throw happened inside the `catch` block, so it wasn’t handled and **the whole `runTest()` failed**. The server then returned 500 and no execution/report was saved. So you never saw a report or a screenshot when a step failed.

2. **Report didn’t show screenshots**  
   Even when a screenshot path was stored on the execution, the HTML report only had Step, Status, and Error. There was no column or link for the screenshot, so you couldn’t see it from the report.

3. **Playwright selectors**  
   - `page.fill(step.label, step.value)` uses `step.label` as the **selector**. On the-internet.herokuapp.com/login, the username field has `id="username"`, not the text "Username". So for that site you’d need something like `#username` or `input[name="username"]` as the label/selector, not the human label "Username". If your test was written with human labels, fill/click might be failing for selector reasons before you even get to the "expected" step.  
   - `page.getByText(step.label).click()` is correct for a button with visible text "Login".

## What was changed

1. **Runner (`runner.js`)**  
   - Before taking a screenshot, the code now creates `backend/screenshots` with `fs.mkdirSync(..., { recursive: true })`.  
   - The screenshot call is wrapped in its own try/catch. If saving the image fails, the step is still recorded as Failed with the error message, and `stepResult.screenshot` is set to a short message like `(screenshot failed: ...)` so the run continues and the report is still generated.

2. **Report (`utils/generateReport.js`)**  
   - A **Screenshot** column was added.  
   - For failed steps that have a screenshot path, the report now shows a link and an `<img>` pointing to that file (using a path relative to the report file so it works when you open the HTML from disk).  
   - If the screenshot save failed, the report shows the message stored in `stepResult.screenshot`.

3. **`.gitignore`**  
   - `utils/reports/` and `screenshots/` are ignored so generated reports and screenshots aren’t committed.

## How to verify

1. Create the **Validation Failure Test** (your `body_fail`): run `node test-create-test.js` (with the script set to send `body_fail`).  
2. Get the test id: `node test-run-test.js`.  
3. Run that test: `node test-run-test.js <id>`.  
4. You should get:  
   - A 200 response with `execution` and `report` path.  
   - The step "WrongCheck" should be Failed (expected "Some wrong text" not found).  
   - `backend/screenshots/` should contain a PNG for that step.  
   - Opening the report HTML should show the Screenshot column with a link and the image for the failed step.

## Selector vs label

Right now, **step.label** is used both as:

- The selector for `page.fill()` and `page.getByText()` (e.g. `#username` or "Login").  
- The display label in the report.

For **the-internet.herokuapp.com/login**:

- Username field: selector should be `#username` (or `input[name="username"]`), not the word "Username".  
- Password field: `#password`.  
- Login button: `getByText("Login")` is fine.

So either:

- Store **selectors** in `label` (e.g. `#username`, `#password`) and keep a separate human-readable name for the report if needed, or  
- Add a separate field in the step model (e.g. `selector`) and use that for Playwright while keeping `label` for display.

That way fill/click will work on that page and the failure you’ll see will be the **expected** assertion ("Some wrong text" not found), which will correctly trigger the screenshot and the new report column.
