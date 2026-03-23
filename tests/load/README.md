# Total IK — Load Test

## Forberedelser

### 1. Installer k6
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows
winget install k6
```

### 2. Opprett testbruker
Opprett en dedikert testbruker i appen med kjent passord. Ikke bruk en ekte admin-konto.

### 3. Sett miljøvariabler
```bash
export TEST_EMAIL="loadtest@totalik.no"
export TEST_PASSWORD="LoadTest2024!"
```

## Kjøring

### Baseline (lett)
```bash
k6 run --vus 5 --duration 1m tests/load/k6-loadtest.js
```

### Full test
```bash
k6 run tests/load/k6-loadtest.js
```

### Med JSON-output
```bash
k6 run --out json=results.json tests/load/k6-loadtest.js
```

## Tolkning av resultater

| Metrikk | ✅ Bestått | ⚠️ Advarsel | ❌ Feilet |
|---------|-----------|-------------|----------|
| p95 responstid | < 500ms | 500–1000ms | > 1000ms |
| Auth p95 | < 800ms | 800–1500ms | > 1500ms |
| Edge fn p95 | < 1000ms | 1–2s | > 2s |
| Feilrate | < 1% | 1–5% | > 5% |
| Throughput | > 50 req/s | 30–50 | < 30 |

## Opprydding
Slett test-avvik etter kjøring:
```sql
DELETE FROM deviations WHERE title LIKE 'Load test avvik%';
```
