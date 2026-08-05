"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyTz = getCompanyTz;
exports.getTodayInTz = getTodayInTz;
exports.getNowInTz = getNowInTz;
exports.getTimeInTz = getTimeInTz;
exports.getDateStringInTz = getDateStringInTz;
const DEFAULT_TZ = 'UTC';
function getCompanyTz(settings) {
    return settings?.timezone || DEFAULT_TZ;
}
function getTodayInTz(tz) {
    const now = new Date();
    const tzNow = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    return new Date(Date.UTC(tzNow.getFullYear(), tzNow.getMonth(), tzNow.getDate()));
}
function getNowInTz(tz) {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: tz }));
}
function getTimeInTz(tz) {
    const d = getNowInTz(tz);
    return { hours: d.getHours(), minutes: d.getMinutes() };
}
function getDateStringInTz(tz) {
    const d = getNowInTz(tz);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
//# sourceMappingURL=company-time.js.map