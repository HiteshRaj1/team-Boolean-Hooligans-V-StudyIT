const dateStr = "2026-09-20";
const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
console.log("Parsed:", d, d.getTime());
console.log("Valid?", !isNaN(d.getTime()));
const nowTime = new Date().getTime();
console.log("Future?", d.getTime() > nowTime - 86400000);
