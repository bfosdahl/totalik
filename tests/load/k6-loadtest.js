import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Config ───────────────────────────────────────────────────────
const BASE_URL = __ENV.SUPABASE_URL || 'https://sffkcqclfiffnpxorodd.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZmtjcWNsZmlmZm5weG9yb2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTI4MzIsImV4cCI6MjA3OTc4ODgzMn0.Gx3CZwKvWLtNyLPhyJXv5qalkr9CjDrzGkNsfrajF-s';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'loadtest@totalik.no';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'LoadTest2024!';

// ─── Custom metrics ───────────────────────────────────────────────
const authDuration = new Trend('auth_duration', true);
const dashboardDuration = new Trend('dashboard_duration', true);
const deviationInsertDuration = new Trend('deviation_insert_duration', true);
const edgeFnDuration = new Trend('edge_fn_duration', true);
const errorRate = new Rate('errors');

// ─── Test profile ─────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 30 },
    { duration: '3m', target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    auth_duration: ['p(95)<800'],
    dashboard_duration: ['p(95)<500'],
    deviation_insert_duration: ['p(95)<500'],
    edge_fn_duration: ['p(95)<1000'],
    errors: ['rate<0.01'],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────
const baseHeaders = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
};

function authHeaders(token) {
  return Object.assign({}, baseHeaders, {
    'Authorization': 'Bearer ' + token,
  });
}

// ─── Main test ────────────────────────────────────────────────────
export default function () {
  let accessToken = '';
  let companyId = '';
  let userId = '';

  // ── Scenario A: Auth (sign in) ──────────────────────────────────
  group('01_auth_signin', function () {
    const res = http.post(
      `${BASE_URL}/auth/v1/token?grant_type=password`,
      JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
      { headers: baseHeaders, tags: { name: 'auth_signin' } }
    );

    authDuration.add(res.timings.duration);
    const success = check(res, {
      'auth: status 200': (r) => r.status === 200,
      'auth: has access_token': (r) => {
        try { return JSON.parse(r.body).access_token !== undefined; }
        catch { return false; }
      },
    });
    errorRate.add(!success);

    if (res.status === 200) {
      try {
        const body = JSON.parse(res.body);
        accessToken = body.access_token;
        userId = body.user?.id || '';
      } catch {}
    }
  });

  if (!accessToken) {
    console.error('Auth failed, skipping remaining scenarios');
    return;
  }

  sleep(0.3);

  // ── Fetch company_id from profile (needed for inserts) ──────────
  group('01b_fetch_profile', function () {
    const res = http.get(
      `${BASE_URL}/rest/v1/profiles?select=company_id&user_id=eq.${userId}&limit=1`,
      { headers: authHeaders(accessToken), tags: { name: 'fetch_profile' } }
    );

    if (res.status === 200) {
      try {
        const rows = JSON.parse(res.body);
        if (rows.length > 0) {
          companyId = rows[0].company_id;
        }
      } catch {}
    }

    if (!companyId) {
      console.warn('Could not fetch company_id — deviation insert will be skipped');
    }
  });

  sleep(0.3);

  // ── Scenario B: Dashboard load (parallel queries) ───────────────
  group('02_dashboard_load', function () {
    const responses = http.batch([
      ['GET', `${BASE_URL}/rest/v1/companies?select=id,status&limit=100`, null, {
        headers: authHeaders(accessToken),
        tags: { name: 'dashboard_companies' },
      }],
      ['GET', `${BASE_URL}/rest/v1/profiles?select=id,is_active&limit=100`, null, {
        headers: authHeaders(accessToken),
        tags: { name: 'dashboard_profiles' },
      }],
      ['GET', `${BASE_URL}/rest/v1/deviations?select=id,status&limit=100`, null, {
        headers: authHeaders(accessToken),
        tags: { name: 'dashboard_deviations' },
      }],
      ['GET', `${BASE_URL}/rest/v1/company_action_plans?select=id,actions&limit=10`, null, {
        headers: authHeaders(accessToken),
        tags: { name: 'dashboard_actions' },
      }],
    ]);

    const maxDuration = Math.max(...responses.map(r => r.timings.duration));
    dashboardDuration.add(maxDuration);

    responses.forEach((res, i) => {
      const success = check(res, {
        [`dashboard query ${i}: status 200`]: (r) => r.status === 200,
      });
      errorRate.add(!success);
    });
  });

  sleep(0.5);

  // ── Scenario C: Deviation insert ────────────────────────────────
  if (companyId) {
    group('03_deviation_insert', function () {
      const now = new Date();
      const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      var payload = {
        company_id: companyId,
        title: 'k6 load test ' + Date.now(),
        description: 'Automatisk generert av k6 load test — kan slettes',
        category: 'HMS',
        priority: 'medium',
        status: 'open',
        type: 'avvik',
        reporter_name: 'k6 Load Test',
        due_date: dueDate,
      };

      var insertHeaders = Object.assign({}, authHeaders(accessToken), {
        'Prefer': 'return=minimal',
      });

      var res = http.post(
        BASE_URL + '/rest/v1/deviations',
        JSON.stringify(payload),
        {
          headers: insertHeaders,
          tags: { name: 'deviation_insert' },
        }
      );

      deviationInsertDuration.add(res.timings.duration);
      const success = check(res, {
        'deviation insert: status 2xx': (r) => r.status >= 200 && r.status < 300,
      });
      errorRate.add(!success);

      if (res.status >= 300) {
        console.error(`Deviation insert failed: ${res.status} ${res.body}`);
      }
    });
  }

  sleep(0.5);

  // ── Scenario D: Edge function (monitoring-stats) ────────────────
  group('04_edge_function', function () {
    const res = http.post(
      `${BASE_URL}/functions/v1/monitoring-stats`,
      JSON.stringify({}),
      {
        headers: authHeaders(accessToken),
        tags: { name: 'monitoring_stats' },
      }
    );

    edgeFnDuration.add(res.timings.duration);
    const success = check(res, {
      'edge fn: status 200': (r) => r.status === 200,
      'edge fn: has data': (r) => {
        try { return JSON.parse(r.body).activeCompanies !== undefined; }
        catch { return false; }
      },
    });
    errorRate.add(!success);
  });

  sleep(1);
}

// ─── Summary ──────────────────────────────────────────────────────
export function handleSummary(data) {
  const lines = [
    '',
    '═══════════════════════════════════════════════',
    '  TOTAL IK LOAD TEST — RESULTATER',
    '═══════════════════════════════════════════════',
    '',
  ];

  const metrics = [
    ['Auth (sign-in)', data.metrics.auth_duration],
    ['Dashboard (load)', data.metrics.dashboard_duration],
    ['Avvik (insert)', data.metrics.deviation_insert_duration],
    ['Edge fn (monitoring)', data.metrics.edge_fn_duration],
  ];

  metrics.forEach(([name, m]) => {
    if (m && m.values) {
      const v = m.values;
      const p95 = v['p(95)']?.toFixed(0) || '?';
      const pass = parseFloat(p95) < 800 ? '✅' : '❌';
      lines.push(`${pass} ${name}:`);
      lines.push(`    p50: ${v.med?.toFixed(0) || '?'}ms | p95: ${p95}ms | p99: ${v['p(99)']?.toFixed(0) || '?'}ms | max: ${v.max?.toFixed(0) || '?'}ms`);
      lines.push('');
    }
  });

  if (data.metrics.errors && data.metrics.errors.values) {
    const errPct = (data.metrics.errors.values.rate * 100).toFixed(2);
    const pass = parseFloat(errPct) < 1 ? '✅' : '❌';
    lines.push(`${pass} Feilrate: ${errPct}%`);
  }

  if (data.metrics.http_reqs && data.metrics.http_reqs.values) {
    lines.push(`   Total requests: ${data.metrics.http_reqs.values.count}`);
    lines.push(`   Throughput: ${data.metrics.http_reqs.values.rate?.toFixed(1)} req/s`);
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════');
  lines.push('');

  console.log(lines.join('\n'));

  return {
    stdout: lines.join('\n'),
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}
