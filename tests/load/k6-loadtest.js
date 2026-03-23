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
    { duration: '30s', target: 10 },  // Ramp up to 10 VU
    { duration: '1m', target: 30 },   // Ramp up to 30 VU
    { duration: '3m', target: 30 },   // Hold 30 VU
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    auth_duration: ['p(95)<800'],
    dashboard_duration: ['p(95)<500'],
    deviation_insert_duration: ['p(95)<500'],
    edge_fn_duration: ['p(95)<1000'],
    errors: ['rate<0.01'],  // < 1% error rate
  },
};

// ─── Helpers ──────────────────────────────────────────────────────
const headers = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
};

function authHeaders(token) {
  return {
    ...headers,
    'Authorization': `Bearer ${token}`,
  };
}

// ─── Main test ────────────────────────────────────────────────────
export default function () {
  let accessToken = '';

  // ── Scenario A: Auth (sign in) ──────────────────────────────────
  group('01_auth_signin', function () {
    const res = http.post(
      `${BASE_URL}/auth/v1/token?grant_type=password`,
      JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
      { headers, tags: { name: 'auth_signin' } }
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
        accessToken = JSON.parse(res.body).access_token;
      } catch {}
    }
  });

  if (!accessToken) {
    console.error('Auth failed, skipping remaining scenarios');
    return;
  }

  sleep(0.5);

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
  group('03_deviation_insert', function () {
    const payload = {
      title: `Load test avvik ${Date.now()}`,
      description: 'Automatisk generert av k6 load test',
      status: 'open',
      priority: 'medium',
      category: 'HMS',
      type: 'hms',
    };

    const res = http.post(
      `${BASE_URL}/rest/v1/deviations`,
      JSON.stringify(payload),
      {
        headers: {
          ...authHeaders(accessToken),
          'Prefer': 'return=minimal',
        },
        tags: { name: 'deviation_insert' },
      }
    );

    deviationInsertDuration.add(res.timings.duration);
    const success = check(res, {
      'deviation insert: status 2xx': (r) => r.status >= 200 && r.status < 300,
    });
    errorRate.add(!success);
  });

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
      lines.push(`${name}:`);
      lines.push(`  p50: ${v.med?.toFixed(0) || '?'}ms | p95: ${v['p(95)']?.toFixed(0) || '?'}ms | p99: ${v['p(99)']?.toFixed(0) || '?'}ms | max: ${v.max?.toFixed(0) || '?'}ms`);
      lines.push('');
    }
  });

  if (data.metrics.errors && data.metrics.errors.values) {
    const errPct = (data.metrics.errors.values.rate * 100).toFixed(2);
    lines.push(`Feilrate: ${errPct}%`);
  }

  if (data.metrics.http_reqs && data.metrics.http_reqs.values) {
    lines.push(`Total requests: ${data.metrics.http_reqs.values.count}`);
    lines.push(`Throughput: ${data.metrics.http_reqs.values.rate?.toFixed(1)} req/s`);
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════');

  console.log(lines.join('\n'));

  return {
    stdout: lines.join('\n'),
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}
