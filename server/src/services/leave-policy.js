'use strict';

const ANNUAL_LEAVE_DAYS = 12;

function toTimestamp(value) {
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return value;

    const raw = String(value ?? '').trim();
    if (!raw) return Number.NaN;
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : Date.parse(raw);
}

function annualLeaveEntitlement(joinDate, leaveYear) {
    const joined = new Date(toTimestamp(joinDate));
    const year = Number(leaveYear);
    if (!Number.isFinite(year)) return 0;
    if (Number.isNaN(joined.getTime())) return ANNUAL_LEAVE_DAYS;

    const joinedYear = joined.getUTCFullYear();
    if (joinedYear < year) return ANNUAL_LEAVE_DAYS;
    if (joinedYear > year) return 0;
    return ANNUAL_LEAVE_DAYS - joined.getUTCMonth();
}

module.exports = { ANNUAL_LEAVE_DAYS, annualLeaveEntitlement };
