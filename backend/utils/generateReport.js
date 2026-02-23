const fs = require('fs');
const path = require('path');

function generateHTMLReport(execution) {
    const reportsDir = path.join(__dirname, 'reports');
    fs.mkdirSync(reportsDir, { recursive: true });

    const rows = (execution.results || []).map(r => {
        let screenshotCell = '-';
        if (r.screenshot && r.status === 'Failed') {
            if (r.screenshot.startsWith('(')) {
                screenshotCell = r.screenshot;
            } else {
                const rel = path.relative(reportsDir, r.screenshot).replace(/\\/g, '/');
                screenshotCell = `<a href="${rel}" target="_blank">Screenshot</a> <img src="${rel}" alt="screenshot" style="max-width:400px;display:block;margin-top:4px;" />`;
            }
        }
        return `<tr><td>${r.label}</td><td>${r.status}</td><td>${r.error || '-'}</td><td>${screenshotCell}</td></tr>`;
    }).join('');

    const html = `
<html>
<head><meta charset="utf-8"><title>Report - ${execution.testName}</title></head>
<body>
<h1>Test Report - ${execution.testName}</h1>
<h3>Status: ${execution.overallStatus}</h3>
<table border="1" cellpadding="8">
<tr><th>Step</th><th>Status</th><th>Error</th><th>Screenshot</th></tr>
${rows}
</table>
</body>
</html>`;

    const filePath = path.join(reportsDir, `${Date.now()}-report.html`);
    fs.writeFileSync(filePath, html);
    return filePath;
}

module.exports=generateHTMLReport;