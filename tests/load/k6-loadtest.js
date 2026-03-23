import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// ─── Config ───────────────────────────────────────────────────────
var BASE_URL = __ENV.SUPABASE_URL || 'https://sffkcqclfiffnpxorodd.supabase.co';
var ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZmtjcWNsZmlmZm5weG9yb2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTI4MzIsImV4cCI6MjA3OTc4ODgzMn0.Gx3CZwKvWLtNyLPhyJXv5qalkr9CjDrzGkNsfrajF-s';
var TEST_EMAIL = __ENV.TEST_EMAIL || 'loadtest@totalik.no';
var TEST_PASSWORD = __ENV.TEST_PASSWORD || 'LoadTest2024!';

// ─── Custom metrics ───────────────────────────────────────────────
var dashboardDuration = new Trend('dashboard_duration', true);
var deviationInsertDuration = new Trend('deviation_insert_duration', true);
var edgeFnDuration = new Trend('edge_fn_duration', true);
var errorRate = new Rate('errors');

// ─── Test profile ─────────────────────────────────────────────────
export var options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 30 },
    { duration: '3m', target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    dashboard_duration: ['p(95)<500'],
    deviation_insert_duration: ['p(95)<500'],
    edge_fn_duration: ['p(95)<1000'],
    errors: ['rate<0.01'],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────
var baseHeaders = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
};

function makeAuthHeaders(token) {
  return Object.assign({}, baseHeaders, {
    'Authorization': 'Bearer ' + token,
  });
}

// ─── Setup: authenticate once, share token ────────────────────────
export function setup() {
  var res = http.post(
    BASE_URL + '/auth/v1/token?grant_type=password',
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: baseHeaders }
  );

  if (res.status !== 200) {
    console.error('Setup auth failed: ' + res.status + ' ' + res.body);
    return { accessToken: '', companyId: '', userId: '' };
  }

  var body = JSON.parse(res.body);
  var accessToken = body.access_token;
  var userId = body.user ? body.user.id : '';

  // Fetch company_id
  var companyId = '';
  var profileRes = http.get(
    BASE_URL + '/rest/v1/profiles?select=company_id&user_id=eq.' + userId + '&limit=1',
    { headers: makeAuthHeaders(accessToken) }
  );
  if (profileRes.status === 200) {
    try {
      var rows = JSON.parse(profileRes.body);
      if (rows.length > 0) { companyId = rows[0].company_id; }
    } catch (e) {}
  }

  console.log('Setup complete — userId: ' + userId + ', companyId: ' + companyId);
  return { accessToken: accessToken, companyId: companyId, userId: userId };
}

// ─── Main test ────────────────────────────────────────────────────
export default function (data) {
  var accessToken = data.accessToken;
  var companyId = data.companyId;

  if (!accessToken) {
    console.error('No access token from setup, skipping');
    errorRate.add(true);
    return;
  }

  var hdrs = makeAuthHeaders(accessToken);

  // ── Scenario A: Dashboard load (parallel queries) ───────────────
  group('01_dashboard_load', function () {
    var responses = http.batch([
      ['GET', BASE_URL + '/rest/v1/companies?select=id,status&limit=100', null, {
        headers: hdrs, tags: { name: 'dashboard_companies' },
      }],
      ['GET', BASE_URL + '/rest/v1/profiles?select=id,is_active&limit=100', null, {
        headers: hdrs, tags: { name: 'dashboard_profiles' },
      }],
      ['GET', BASE_URL + '/rest/v1/deviations?select=id,status&limit=100', null, {
        headers: hdrs, tags: { name: 'dashboard_deviations' },
      }],
    ]);

    var maxDuration = 0;
    for (var i = 0; i < responses.length; i++) {
      if (responses[i].timings.duration > maxDuration) {
        maxDuration = responses[i].timings.duration;
      }
    }
    dashboardDuration.add(maxDuration);

    for (var j = 0; j < responses.length; j++) {
      var success = check(responses[j], {
        'dashboard query: status 200': function (r) { return r.status === 200; },
      });
      if (responses[j].status !== 200) {
        console.error('Dashboard query ' + j + ' failed: ' + responses[j].status + ' ' + responses[j].body.substring(0, 200));
      }
      errorRate.add(!success);
    }
  });

  sleep(0.5);

  // ── Scenario B: Deviation insert ────────────────────────────────
  if (companyId) {
    group('02_deviation_insert', function () {
      var now = new Date();
      var dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);

      var payload = {
        company_id: companyId,
        title: 'k6 load test ' + Date.now(),
        description: 'Automatisk generert av k6 load test — kan slettes',
        category: 'safety',
        priority: 'medium',
        status: 'open',
        type: 'avvik',
        reporter_name: 'k6 Load Test',
        due_date: dueDate,
      };

      var insertHeaders = Object.assign({}, hdrs, { 'Prefer': 'return=minimal' });

      var res = http.post(
        BASE_URL + '/rest/v1/deviations',
        JSON.stringify(payload),
        { headers: insertHeaders, tags: { name: 'deviation_insert' } }
      );

      deviationInsertDuration.add(res.timings.duration);
      var success = check(res, {
        'deviation insert: status 2xx': function (r) { return r.status >= 200 && r.status < 300; },
      });
      errorRate.add(!success);

      if (res.status >= 300) {
        console.error('Deviation insert failed: ' + res.status + ' ' + res.body);
      }
    });
  }

  sleep(0.5);

  // ── Scenario C: Edge function (monitoring-stats) ────────────────
  group('03_edge_function', function () {
    var res = http.post(
      BASE_URL + '/functions/v1/monitoring-stats',
      JSON.stringify({}),
      { headers: hdrs, tags: { name: 'monitoring_stats' } }
    );

    edgeFnDuration.add(res.timings.duration);
    var success = check(res, {
      'edge fn: status 200': function (r) { return r.status === 200; },
      'edge fn: has data': function (r) {
        try { return JSON.parse(r.body).activeCompanies !== undefined; }
        catch (e) { return false; }
      },
    });
    errorRate.add(!success);
  });

  sleep(1);
}

// ─── Summary ──────────────────────────────────────────────────────
export function handleSummary(data) {
  var lines = [
    '',
    '═══════════════════════════════════════════════',
    '  TOTAL IK LOAD TEST — RESULTATER',
    '═══════════════════════════════════════════════',
    '',
  ];

  var metrics = [
    ['Dashboard (load)', data.metrics.dashboard_duration, 500],
    ['Avvik (insert)', data.metrics.deviation_insert_duration, 500],
    ['Edge fn (monitoring)', data.metrics.edge_fn_duration, 1000],
  ];

  for (var i = 0; i < metrics.length; i++) {
    var name = metrics[i][0];
    var m = metrics[i][1];
    var limit = metrics[i][2];
    if (m && m.values) {
      var v = m.values;
      var p95 = v['p(95)'] ? v['p(95)'].toFixed(0) : '?';
      var p99 = v['p(99)'] ? v['p(99)'].toFixed(0) : '?';
      var med = v.med ? v.med.toFixed(0) : '?';
      var max = v.max ? v.max.toFixed(0) : '?';
      var pass = parseFloat(p95) < limit ? '✅' : '❌';
      lines.push(pass + ' ' + name + ':');
      lines.push('    p50: ' + med + 'ms | p95: ' + p95 + 'ms | p99: ' + p99 + 'ms | max: ' + max + 'ms');
      lines.push('');
    }
  }

  if (data.metrics.errors && data.metrics.errors.values) {
    var errPct = (data.metrics.errors.values.rate * 100).toFixed(2);
    var errPass = parseFloat(errPct) < 1 ? '✅' : '❌';
    lines.push(errPass + ' Feilrate: ' + errPct + '%');
  }

  if (data.metrics.http_reqs && data.metrics.http_reqs.values) {
    lines.push('   Total requests: ' + data.metrics.http_reqs.values.count);
    var rate = data.metrics.http_reqs.values.rate ? data.metrics.http_reqs.values.rate.toFixed(1) : '?';
    lines.push('   Throughput: ' + rate + ' req/s');
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
