const { query } = require('../db/connection');

const DAY_MS = 86400000;
const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const NO_REPORT_SCOPE = '__NO_REPORT_SCOPE__';

const MANAGER_ROLES = new Set(['Trưởng Khối', 'Trưởng Phòng']);
const ACCEPTED_RESULT_VALUES = ['ĐẠT', 'PASSED', 'PASS', 'ACCEPTED', 'OFFER_ACCEPTED'];
const FAILED_RESULT_VALUES = ['KHÔNG ĐẠT', 'FAILED', 'FAIL', 'REJECTED'];
const EXCLUDED_REQUEST_STATUSES = [
    'REJECTED', 'CANCELLED', 'CANCELED', 'REJECT', 'DECLINED',
    'HUY', 'HỦY', 'ĐÃ HỦY', 'TỪ CHỐI', 'ĐÃ TỪ CHỐI'
];
const REWARD_TYPE_VALUES = ['REWARD', 'KHEN_THUONG', 'KHEN THUONG', 'KHEN THƯỞNG'];
const DISCIPLINE_TYPE_VALUES = ['DISCIPLINE', 'KY_LUAT', 'KY LUAT', 'KỶ LUẬT'];

const CANDIDATE_STATUS_GROUPS = [
    {
        canonical: 'tiếp nhận hồ sơ',
        aliases: ['new', 'submitted', 's1: mới', 'đã tiếp nhận hồ sơ', 'tiếp nhận hồ sơ']
    },
    {
        canonical: 'đã sơ loại',
        aliases: ['screened', 'đã sơ loại', 'đã sơ loại, đạt', 'đã sơ loại, không đạt']
    },
    {
        canonical: 'đã tạo lịch',
        aliases: ['interviewing', 'đã tạo lịch']
    },
    {
        canonical: 'đã phỏng vấn',
        aliases: ['interviewed', 's2: phỏng vấn', 'đã phỏng vấn', 'đã phỏng vấn, đạt', 'đã phỏng vấn, không đạt']
    },
    {
        canonical: 'đã quyết định loại',
        aliases: ['rejected', 'offer_rejected', 's7: loại', 'loại', 'đã quyết định loại']
    },
    {
        canonical: 'đã quyết định tuyển',
        aliases: ['passed', 'offer_accepted', 's5: trúng tuyển', 'đạt', 'đã quyết định tuyển']
    },
    {
        canonical: 'đi làm',
        aliases: ['hired', 'đã chuyển thành nhân viên', 'đã chuyển nhân viên', 'đi làm']
    }
];

function normalizedText(value) {
    return String(value || '').trim().toLocaleLowerCase('vi-VN');
}

function upperText(value) {
    return String(value || '').trim().toLocaleUpperCase('vi-VN');
}

function toNumber(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
}

function round2(value) {
    return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}

function percentage(numerator, denominator) {
    return denominator ? round2((toNumber(numerator) / toNumber(denominator)) * 100) : 0;
}

function parseReportDate(value, endOfDay = false) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;

    const text = String(value).trim();
    if (/^\d+$/.test(text)) return Number(text);
    const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
        const timestamp = Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
        return timestamp + (endOfDay ? DAY_MS - 1 : 0);
    }

    const timestamp = new Date(text).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
}

function parsePagination(queryParams = {}) {
    const requestedPage = Number.parseInt(queryParams.page, 10);
    const requestedSize = Number.parseInt(queryParams.size, 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : DEFAULT_PAGE;
    const size = Number.isInteger(requestedSize) && requestedSize > 0
        ? Math.min(requestedSize, MAX_PAGE_SIZE)
        : DEFAULT_SIZE;
    return { page, size, offset: (page - 1) * size };
}

function paginate(items, pagination) {
    return items.slice(pagination.offset, pagination.offset + pagination.size);
}

function whereClause(conditions) {
    return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
}

function addListCondition(conditions, params, column, values, negate = false) {
    const placeholders = values.map(() => '?').join(', ');
    conditions.push(`UPPER(LTRIM(RTRIM(COALESCE(${column}, '')))) ${negate ? 'NOT ' : ''}IN (${placeholders})`);
    params.push(...values.map(upperText));
}

function normalizeCandidateStatus(value) {
    const normalized = normalizedText(value);
    const group = CANDIDATE_STATUS_GROUPS.find((item) =>
        [item.canonical, ...item.aliases].some((alias) => normalizedText(alias) === normalized)
    );
    return group ? group.canonical : String(value || '').trim();
}

function candidateStatusValues(value) {
    const normalized = normalizeCandidateStatus(value);
    const group = CANDIDATE_STATUS_GROUPS.find((item) => item.canonical === normalized);
    return group ? [group.canonical, ...group.aliases] : [String(value || '').trim()];
}

function normalizeEvaluationResult(value) {
    const normalized = upperText(value);
    if (ACCEPTED_RESULT_VALUES.includes(normalized)) return 'ĐẠT';
    if (FAILED_RESULT_VALUES.includes(normalized)) return 'KHÔNG ĐẠT';
    return String(value || '').trim();
}

function evaluationResultValues(value) {
    const normalized = normalizeEvaluationResult(value);
    if (normalized === 'ĐẠT') return ACCEPTED_RESULT_VALUES;
    if (normalized === 'KHÔNG ĐẠT') return FAILED_RESULT_VALUES;
    return [String(value || '').trim()];
}

function normalizeRewardType(value) {
    const normalized = upperText(value);
    if (REWARD_TYPE_VALUES.map(upperText).includes(normalized)) return 'REWARD';
    if (DISCIPLINE_TYPE_VALUES.map(upperText).includes(normalized)) return 'DISCIPLINE';
    return String(value || '').trim();
}

function rewardTypeValues(value) {
    const normalized = normalizeRewardType(value);
    if (normalized === 'REWARD') return REWARD_TYPE_VALUES;
    if (normalized === 'DISCIPLINE') return DISCIPLINE_TYPE_VALUES;
    return [String(value || '').trim()];
}

function addDateRange(conditions, params, column, from, to) {
    if (from !== null) {
        conditions.push(`${column} >= ?`);
        params.push(from);
    }
    if (to !== null) {
        conditions.push(`${column} <= ?`);
        params.push(to);
    }
}

async function resolveDepartmentScope(req, requestedDepartmentId) {
    const requested = String(requestedDepartmentId || '').trim();
    const hasRequestedDepartment = requested && requested.toUpperCase() !== 'ALL';
    if (!MANAGER_ROLES.has(req.user?.roleName)) {
        return { departmentIds: hasRequestedDepartment ? [requested] : null };
    }

    const rootId = String(req.user?.deptId || '').trim();
    if (!rootId) return { departmentIds: [NO_REPORT_SCOPE] };

    const departments = await query(
        'SELECT department_id, parent_department_id FROM Department WHERE status = 1'
    );
    const childrenByParent = new Map();
    departments.forEach((department) => {
        const parentId = String(department.parent_department_id || '');
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId).push(String(department.department_id));
    });

    const allowed = [];
    const seen = new Set();
    const pending = [rootId];
    while (pending.length) {
        const departmentId = pending.shift();
        if (seen.has(departmentId)) continue;
        seen.add(departmentId);
        allowed.push(departmentId);
        (childrenByParent.get(departmentId) || []).forEach((childId) => pending.push(childId));
    }

    if (hasRequestedDepartment) {
        return { departmentIds: allowed.includes(requested) ? [requested] : [NO_REPORT_SCOPE] };
    }
    return { departmentIds: allowed.length ? allowed : [NO_REPORT_SCOPE] };
}

async function buildEntityFilters(req, { departmentColumn, positionColumn }) {
    const scope = await resolveDepartmentScope(req, req.query.departmentId);
    const conditions = [];
    const params = [];
    if (scope.departmentIds) {
        conditions.push(`${departmentColumn} IN (${scope.departmentIds.map(() => '?').join(', ')})`);
        params.push(...scope.departmentIds);
    }

    const positionId = String(req.query.positionId || '').trim();
    if (positionId && positionId.toUpperCase() !== 'ALL') {
        conditions.push(`${positionColumn} = ?`);
        params.push(positionId);
    }
    return { conditions, params };
}

function mapRecruitmentResult(row) {
    const requiredCount = toNumber(row.required_count);
    const appliedCount = toNumber(row.applied_count);
    const passedCount = toNumber(row.passed_count);
    const onboardedCount = toNumber(row.onboarded_count);
    return {
        departmentId: row.department_id,
        departmentName: row.department_name || null,
        positionId: row.position_id,
        positionName: row.position_name || null,
        requiredCount,
        appliedCount,
        passedCount,
        onboardedCount,
        passRate: percentage(passedCount, appliedCount),
        onboardRate: percentage(onboardedCount, passedCount),
        fulfillmentRate: percentage(onboardedCount, requiredCount)
    };
}

function recruitmentSummary(items) {
    const summary = items.reduce((result, item) => {
        result.requiredCount += item.requiredCount;
        result.appliedCount += item.appliedCount;
        result.passedCount += item.passedCount;
        result.onboardedCount += item.onboardedCount;
        return result;
    }, { requiredCount: 0, appliedCount: 0, passedCount: 0, onboardedCount: 0 });
    return {
        ...summary,
        passRate: percentage(summary.passedCount, summary.appliedCount),
        onboardRate: percentage(summary.onboardedCount, summary.passedCount),
        fulfillmentRate: percentage(summary.onboardedCount, summary.requiredCount)
    };
}

async function getRecruitmentResult(req) {
    const pagination = parsePagination(req.query);
    const from = parseReportDate(req.query.from);
    const to = parseReportDate(req.query.to, true);
    const reportEnd = to === null ? Date.now() : to;
    const filters = await buildEntityFilters(req, {
        departmentColumn: 'rr.department_id',
        positionColumn: 'rr.position_id'
    });

    // RecruitmentRequest.quantity is the only required-count source because this schema has no request detail table.
    // The report period deliberately uses RecruitmentRequest.created_date, the fixed request creation date available here.
    // This avoids mixing the optional expected_date with the request population and is documented by the API contract.
    addListCondition(filters.conditions, filters.params, 'rr.status', EXCLUDED_REQUEST_STATUSES, true);
    addDateRange(filters.conditions, filters.params, 'rr.created_date', from, to);

    const rows = await query(
        `WITH RequestBase AS (
             SELECT rr.recruitment_request_id, rr.department_id, rr.position_id, rr.quantity
             FROM RecruitmentRequest rr
             ${whereClause(filters.conditions)}
         ), PassedCandidates AS (
             SELECT DISTINCT rd.candidate_id
             FROM RecruitmentDecision rd
             WHERE UPPER(LTRIM(RTRIM(rd.result))) IN (${ACCEPTED_RESULT_VALUES.map(() => '?').join(', ')})
               AND UPPER(LTRIM(RTRIM(COALESCE(rd.status, '')))) NOT IN ('CANCELLED', 'CANCELED')
         ), OnboardedCandidates AS (
             SELECT DISTINCT e.candidate_id
             FROM Employee e
             WHERE e.candidate_id IS NOT NULL
               AND ((e.join_date IS NOT NULL AND e.join_date <= ?)
                    OR (e.is_active = 1 AND e.employment_status = 'WORKING'))
         ), CandidateMetrics AS (
             SELECT c.recruitment_request_id,
                    COUNT(DISTINCT c.candidate_id) as applied_count,
                    COUNT(DISTINCT passed.candidate_id) as passed_count,
                    COUNT(DISTINCT onboarded.candidate_id) as onboarded_count
             FROM Candidate c
             JOIN RequestBase rb ON rb.recruitment_request_id = c.recruitment_request_id
             LEFT JOIN PassedCandidates passed ON passed.candidate_id = c.candidate_id
             LEFT JOIN OnboardedCandidates onboarded ON onboarded.candidate_id = c.candidate_id
             GROUP BY c.recruitment_request_id
         )
         SELECT rb.department_id, d.department_name, rb.position_id, p.position_name,
                SUM(rb.quantity) as required_count,
                SUM(COALESCE(metrics.applied_count, 0)) as applied_count,
                SUM(COALESCE(metrics.passed_count, 0)) as passed_count,
                SUM(COALESCE(metrics.onboarded_count, 0)) as onboarded_count
         FROM RequestBase rb
         LEFT JOIN CandidateMetrics metrics ON metrics.recruitment_request_id = rb.recruitment_request_id
         LEFT JOIN Department d ON d.department_id = rb.department_id
         LEFT JOIN Position p ON p.position_id = rb.position_id
         GROUP BY rb.department_id, d.department_name, rb.position_id, p.position_name
         ORDER BY d.department_name, p.position_name`,
        [
            ...filters.params,
            ...ACCEPTED_RESULT_VALUES.map(upperText),
            reportEnd
        ]
    );
    const allItems = rows.map(mapRecruitmentResult);
    return {
        summary: recruitmentSummary(allItems),
        chart: allItems,
        items: paginate(allItems, pagination),
        page: pagination.page,
        size: pagination.size,
        totalItems: allItems.length
    };
}

async function getRecruitmentEvaluations(req) {
    const pagination = parsePagination(req.query);
    const filters = await buildEntityFilters(req, {
        departmentColumn: 'rr.department_id',
        positionColumn: 'rr.position_id'
    });
    addDateRange(filters.conditions, filters.params, 'ie.evaluation_date', parseReportDate(req.query.from), parseReportDate(req.query.to, true));

    const status = String(req.query.status || '').trim();
    if (status && status.toUpperCase() !== 'ALL') {
        addListCondition(filters.conditions, filters.params, 'c.status', candidateStatusValues(status));
    }
    const result = String(req.query.result || '').trim();
    if (result && result.toUpperCase() !== 'ALL') {
        addListCondition(filters.conditions, filters.params, 'ie.overall_result', evaluationResultValues(result));
    }

    const fromSql = `FROM InterviewEvaluation ie
        JOIN Candidate c ON c.candidate_id = ie.candidate_id
        JOIN RecruitmentRequest rr ON rr.recruitment_request_id = c.recruitment_request_id
        LEFT JOIN Position p ON p.position_id = rr.position_id
        LEFT JOIN Department d ON d.department_id = rr.department_id
        LEFT JOIN Employee evaluator ON evaluator.employee_id = ie.evaluator_id`;
    const whereSql = whereClause(filters.conditions);
    const [groupedRows, pageRows] = await Promise.all([
        query(
            `SELECT ie.overall_result as result, COUNT(*) as count
             ${fromSql} ${whereSql}
             GROUP BY ie.overall_result`,
            filters.params
        ),
        query(
            `SELECT ie.interview_eval_id, c.candidate_code, c.full_name,
                    p.position_name, d.department_name, c.status as candidate_status,
                    ie.evaluation_date, ie.overall_result as result,
                    ie.overall_comment as comment, evaluator.full_name as evaluator_name,
                    rr.request_code as recruitment_request_code
             ${fromSql} ${whereSql}
             ORDER BY ie.evaluation_date DESC, ie.interview_eval_id
             OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
            [...filters.params, pagination.offset, pagination.size]
        )
    ]);
    const totalItems = groupedRows.reduce((sum, row) => sum + toNumber(row.count), 0);
    const chart = groupedRows.map((row) => ({
        result: normalizeEvaluationResult(row.result),
        count: toNumber(row.count)
    }));
    const summary = groupedRows.reduce((resultSummary, row) => {
        const count = toNumber(row.count);
        const normalized = normalizeEvaluationResult(row.result);
        if (normalized === 'ĐẠT') resultSummary.passedCount += count;
        else if (normalized === 'KHÔNG ĐẠT') resultSummary.failedCount += count;
        else resultSummary.otherCount += count;
        return resultSummary;
    }, { totalEvaluations: totalItems, passedCount: 0, failedCount: 0, otherCount: 0 });
    return {
        summary,
        chart,
        items: pageRows.map((row) => ({
            candidateCode: row.candidate_code,
            fullName: row.full_name,
            positionName: row.position_name || null,
            departmentName: row.department_name || null,
            candidateStatus: normalizeCandidateStatus(row.candidate_status),
            evaluationDate: row.evaluation_date,
            result: normalizeEvaluationResult(row.result),
            comment: row.comment || '',
            evaluatorName: row.evaluator_name || null,
            recruitmentRequestCode: row.recruitment_request_code
        })),
        page: pagination.page,
        size: pagination.size,
        totalItems
    };
}

const AGE_EXPRESSION = `DATEDIFF(DAY,
    DATEADD(SECOND, CONVERT(INT, e.date_of_birth / 1000), CONVERT(DATETIME2, '1970-01-01')),
    GETDATE()) / 365.2425`;
const VALID_DOB_EXPRESSION = 'e.date_of_birth IS NOT NULL AND e.date_of_birth > 0';
const MALE_EXPRESSION = `LOWER(LTRIM(RTRIM(COALESCE(e.gender, '')))) IN ('nam', 'male')`;
const FEMALE_EXPRESSION = `LOWER(LTRIM(RTRIM(COALESCE(e.gender, '')))) IN (NCHAR(7919), 'female')`;

function mapHeadcountRow(row) {
    const ageCount = toNumber(row.age_count);
    return {
        departmentId: row.department_id,
        departmentName: row.department_name || null,
        positionId: row.position_id,
        positionName: row.position_name || null,
        totalEmployees: toNumber(row.total_employees),
        maleCount: toNumber(row.male_count),
        femaleCount: toNumber(row.female_count),
        otherCount: toNumber(row.other_count),
        averageAge: ageCount ? round2(toNumber(row.age_sum) / ageCount) : 0,
        ageSum: toNumber(row.age_sum),
        ageCount
    };
}

function headcountChart(items) {
    const byDepartment = new Map();
    items.forEach((item) => {
        const key = `${item.departmentId || ''}|${item.departmentName || ''}`;
        if (!byDepartment.has(key)) {
            byDepartment.set(key, {
                departmentId: item.departmentId,
                departmentName: item.departmentName,
                totalEmployees: 0,
                maleCount: 0,
                femaleCount: 0,
                otherCount: 0
            });
        }
        const department = byDepartment.get(key);
        department.totalEmployees += item.totalEmployees;
        department.maleCount += item.maleCount;
        department.femaleCount += item.femaleCount;
        department.otherCount += item.otherCount;
    });
    return [...byDepartment.values()];
}

async function getHeadcountStructure(req) {
    const pagination = parsePagination(req.query);
    const filters = await buildEntityFilters(req, {
        departmentColumn: 'e.department_id',
        positionColumn: 'e.position_id'
    });
    filters.conditions.unshift("e.is_active = 1", "e.employment_status = 'WORKING'");
    const rows = await query(
        `SELECT e.department_id, d.department_name, e.position_id, p.position_name,
                COUNT(*) as total_employees,
                SUM(CASE WHEN ${MALE_EXPRESSION} THEN 1 ELSE 0 END) as male_count,
                SUM(CASE WHEN ${FEMALE_EXPRESSION} THEN 1 ELSE 0 END) as female_count,
                SUM(CASE WHEN NOT (${MALE_EXPRESSION}) AND NOT (${FEMALE_EXPRESSION}) THEN 1 ELSE 0 END) as other_count,
                SUM(CASE WHEN ${VALID_DOB_EXPRESSION} THEN CAST(${AGE_EXPRESSION} AS DECIMAL(12, 4)) ELSE CAST(0 AS DECIMAL(12, 4)) END) as age_sum,
                SUM(CASE WHEN ${VALID_DOB_EXPRESSION} THEN 1 ELSE 0 END) as age_count
         FROM Employee e
         LEFT JOIN Department d ON d.department_id = e.department_id
         LEFT JOIN Position p ON p.position_id = e.position_id
         ${whereClause(filters.conditions)}
         GROUP BY e.department_id, d.department_name, e.position_id, p.position_name
         ORDER BY d.department_name, p.position_name`,
        filters.params
    );
    const allItems = rows.map(mapHeadcountRow);
    const totalEmployees = allItems.reduce((sum, item) => sum + item.totalEmployees, 0);
    const maleCount = allItems.reduce((sum, item) => sum + item.maleCount, 0);
    const femaleCount = allItems.reduce((sum, item) => sum + item.femaleCount, 0);
    const otherCount = allItems.reduce((sum, item) => sum + item.otherCount, 0);
    const ageCount = allItems.reduce((sum, item) => sum + item.ageCount, 0);
    const ageSum = allItems.reduce((sum, item) => sum + item.ageSum, 0);
    return {
        summary: {
            totalEmployees,
            maleCount,
            femaleCount,
            otherCount,
            averageAge: ageCount ? round2(ageSum / ageCount) : 0
        },
        chart: headcountChart(allItems),
        items: paginate(allItems, pagination).map(({ ageSum: _ageSum, ageCount: _ageCount, ...item }) => item),
        page: pagination.page,
        size: pagination.size,
        totalItems: allItems.length
    };
}

function movementItem(row, movementType, movementDate) {
    return {
        employeeId: row.employee_id,
        employeeCode: row.employee_code,
        fullName: row.full_name,
        departmentId: row.department_id,
        departmentName: row.department_name || null,
        positionId: row.position_id,
        positionName: row.position_name || null,
        movementType,
        movementDate
    };
}

async function getHeadcountMovement(req) {
    const pagination = parsePagination(req.query);
    const from = parseReportDate(req.query.from);
    const to = parseReportDate(req.query.to, true);
    const periodStart = from === null ? 0 : from;
    const periodEnd = to === null ? Date.now() : to;
    const filters = await buildEntityFilters(req, {
        departmentColumn: 'e.department_id',
        positionColumn: 'e.position_id'
    });

    // Employee.join_date and Employee.resignation_date are the canonical movement dates in this schema.
    // Department and position details use the current Employee links because no historical snapshot is stored here.
    const beginningConditions = [...filters.conditions,
        'e.join_date IS NOT NULL', 'e.join_date < ?', '(e.resignation_date IS NULL OR e.resignation_date >= ?)'];
    const beginningRow = await query(
        `SELECT COUNT(*) as count
         FROM Employee e
         ${whereClause(beginningConditions)}`,
        [...filters.params, periodStart, periodStart]
    );
    const beginning = toNumber(beginningRow[0]?.count);

    const movementConditions = [...filters.conditions,
        `((e.join_date IS NOT NULL AND e.join_date >= ? AND e.join_date <= ?)
          OR (e.resignation_date IS NOT NULL AND e.resignation_date >= ? AND e.resignation_date <= ?))`];
    const movementRows = await query(
        `SELECT e.employee_id, e.employee_code, e.full_name, e.department_id, d.department_name,
                e.position_id, p.position_name, e.join_date, e.resignation_date
         FROM Employee e
         LEFT JOIN Department d ON d.department_id = e.department_id
         LEFT JOIN Position p ON p.position_id = e.position_id
         ${whereClause(movementConditions)}
         ORDER BY COALESCE(e.join_date, e.resignation_date) DESC, e.employee_code`,
        [...filters.params, periodStart, periodEnd, periodStart, periodEnd]
    );
    const increases = movementRows
        .filter((row) => row.join_date !== null && row.join_date !== undefined
            && toNumber(row.join_date) >= periodStart && toNumber(row.join_date) <= periodEnd)
        .map((row) => movementItem(row, 'INCREASE', row.join_date));
    const decreases = movementRows
        .filter((row) => row.resignation_date !== null && row.resignation_date !== undefined
            && toNumber(row.resignation_date) >= periodStart && toNumber(row.resignation_date) <= periodEnd)
        .map((row) => movementItem(row, 'DECREASE', row.resignation_date));
    const increased = increases.length;
    const decreased = decreases.length;
    const ending = beginning + increased - decreased;
    const averageHeadcount = round2((beginning + ending) / 2);
    const items = [...increases, ...decreases].sort((a, b) =>
        toNumber(b.movementDate) - toNumber(a.movementDate) || String(a.employeeCode).localeCompare(String(b.employeeCode))
    );
    return {
        summary: {
            beginning,
            increased,
            decreased,
            ending,
            averageHeadcount,
            turnoverRate: percentage(decreased, averageHeadcount)
        },
        chart: [
            { metric: 'beginning', count: beginning },
            { metric: 'increased', count: increased },
            { metric: 'decreased', count: decreased },
            { metric: 'ending', count: ending }
        ],
        increases,
        decreases,
        items: paginate(items, pagination),
        page: pagination.page,
        size: pagination.size,
        totalItems: items.length
    };
}

async function getEmployees(req) {
    const pagination = parsePagination(req.query);
    const filters = await buildEntityFilters(req, {
        departmentColumn: 'e.department_id',
        positionColumn: 'e.position_id'
    });
    const status = String(req.query.status || '').trim();
    if (status && status.toUpperCase() !== 'ALL') {
        const statusValue = status.toUpperCase() === 'ACTIVE' ? 'WORKING' : status;
        filters.conditions.push("UPPER(LTRIM(RTRIM(COALESCE(e.employment_status, '')))) = ?");
        filters.params.push(upperText(statusValue));
    }
    const employeeFrom = `FROM Employee e
        LEFT JOIN Department d ON d.department_id = e.department_id
        LEFT JOIN Position p ON p.position_id = e.position_id`;
    const whereSql = whereClause(filters.conditions);
    const [groupedRows, pageRows] = await Promise.all([
        query(
            `SELECT e.employment_status as status, COUNT(*) as count
             ${employeeFrom} ${whereSql}
             GROUP BY e.employment_status`,
            filters.params
        ),
        query(
            `SELECT e.employee_id, e.employee_code, e.full_name,
                    e.department_id, d.department_name, e.position_id, p.position_name,
                    e.join_date, e.employment_status as status, e.resignation_date
             ${employeeFrom} ${whereSql}
             ORDER BY e.full_name, e.employee_id
             OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
            [...filters.params, pagination.offset, pagination.size]
        )
    ]);
    const totalItems = groupedRows.reduce((sum, row) => sum + toNumber(row.count), 0);
    const summary = groupedRows.reduce((result, row) => {
        const count = toNumber(row.count);
        const normalized = upperText(row.status);
        if (normalized === 'WORKING') result.workingCount += count;
        else if (normalized === 'RESIGNED') result.resignedCount += count;
        else result.otherCount += count;
        return result;
    }, { totalEmployees: totalItems, workingCount: 0, resignedCount: 0, otherCount: 0 });
    return {
        summary,
        chart: groupedRows.map((row) => ({ status: row.status || null, count: toNumber(row.count) })),
        items: pageRows.map((row) => ({
            employeeCode: row.employee_code,
            fullName: row.full_name,
            departmentName: row.department_name || null,
            positionName: row.position_name || null,
            joinDate: row.join_date,
            status: row.status,
            resignationDate: row.resignation_date
        })),
        page: pagination.page,
        size: pagination.size,
        totalItems
    };
}

async function getRewardDiscipline(req) {
    const pagination = parsePagination(req.query);
    const filters = await buildEntityFilters(req, {
        departmentColumn: 'e.department_id',
        positionColumn: 'e.position_id'
    });
    addDateRange(filters.conditions, filters.params, 'rd.decision_date', parseReportDate(req.query.from), parseReportDate(req.query.to, true));

    const employeeId = String(req.query.employeeId || '').trim();
    if (employeeId && employeeId.toUpperCase() !== 'ALL') {
        filters.conditions.push('rd.employee_id = ?');
        filters.params.push(employeeId);
    }
    const type = String(req.query.type || '').trim();
    if (type && type.toUpperCase() !== 'ALL') {
        addListCondition(filters.conditions, filters.params, 'rd.decision_type', rewardTypeValues(type));
    }

    // RewardDiscipline has decision_date in the current schema, so the report filters that field.
    // effective_date is intentionally not used as a fallback while decision_date exists.
    const rewardFrom = `FROM RewardDiscipline rd
        JOIN Employee e ON e.employee_id = rd.employee_id
        LEFT JOIN Department d ON d.department_id = e.department_id
        LEFT JOIN Position p ON p.position_id = e.position_id`;
    const whereSql = whereClause(filters.conditions);
    const [groupedRows, pageRows] = await Promise.all([
        query(
            `SELECT rd.decision_type as record_type, COUNT(*) as count
             ${rewardFrom} ${whereSql}
             GROUP BY rd.decision_type`,
            filters.params
        ),
        query(
            `SELECT rd.decision_no, rd.decision_date, rd.employee_id,
                    e.employee_code, e.full_name, e.department_id, d.department_name,
                    e.position_id, p.position_name, rd.decision_type,
                    rd.amount, rd.content, rd.reason, rd.decision_by
             ${rewardFrom} ${whereSql}
             ORDER BY rd.decision_date DESC, rd.reward_discipline_id
             OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
            [...filters.params, pagination.offset, pagination.size]
        )
    ]);
    const totalDecisions = groupedRows.reduce((sum, row) => sum + toNumber(row.count), 0);
    const rewardCount = groupedRows.reduce((sum, row) => sum + (normalizeRewardType(row.record_type) === 'REWARD' ? toNumber(row.count) : 0), 0);
    const disciplineCount = groupedRows.reduce((sum, row) => sum + (normalizeRewardType(row.record_type) === 'DISCIPLINE' ? toNumber(row.count) : 0), 0);
    return {
        summary: { totalDecisions, rewardCount, disciplineCount },
        chart: groupedRows.map((row) => ({ type: normalizeRewardType(row.record_type), count: toNumber(row.count) })),
        items: pageRows.map((row) => {
            const normalizedType = normalizeRewardType(row.decision_type);
            return {
                decisionNo: row.decision_no,
                decisionDate: row.decision_date,
                employeeId: row.employee_id,
                employeeCode: row.employee_code,
                fullName: row.full_name,
                departmentId: row.department_id,
                departmentName: row.department_name || null,
                positionId: row.position_id,
                positionName: row.position_name || null,
                type: normalizedType,
                typeLabel: normalizedType === 'REWARD' ? 'Khen thưởng' : normalizedType === 'DISCIPLINE' ? 'Kỷ luật' : normalizedType,
                amount: toNumber(row.amount),
                description: row.content || row.reason || '',
                reason: row.reason || '',
                decisionMaker: row.decision_by || null
            };
        }),
        page: pagination.page,
        size: pagination.size,
        totalItems: totalDecisions
    };
}

module.exports = {
    getRecruitmentResult,
    getRecruitmentEvaluations,
    getHeadcountStructure,
    getHeadcountMovement,
    getEmployees,
    getRewardDiscipline
};
