import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authGuard, generateToken, GUEST_ACCOUNTS, AuthenticatedRequest } from "../server/middleware/authGuard.js";
import { payloadSanitizer, sanitizeCsvFormula } from "../server/middleware/sanitizer.js";
import { analyzeCivicDataProxy } from "../server/services/geminiProxy.js";
import { PRESET_CRISIS_DAY } from "../src/data/presets.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runBackendApiTests() {
  console.log("=== RUNNING TEST SUITE: BACKEND REST API & SECURITY MIDDLEWARE ===\n");

  // 1. Test CSV Formula Sanitizer directly
  console.log("▶ Testing CSV Formula Sanitizer...");
  const maliciousFormula = "=CMD('calc.exe')";
  const neutralized = sanitizeCsvFormula(maliciousFormula);
  assert(neutralized === "'=CMD('calc.exe')", `Formula sanitized to '${neutralized}'`);

  const validNegativeReading = "-999";
  const preservedNegative = sanitizeCsvFormula(validNegativeReading);
  assert(preservedNegative === "-999", `Valid negative hardware code preserved as '${preservedNegative}'`);

  // 2. Start lightweight test server
  const app = express();
  app.use(express.json());
  app.use(payloadSanitizer);

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const guestAcc = GUEST_ACCOUNTS[email?.toLowerCase()];
    if (guestAcc && guestAcc.password === password) {
      const user = {
        userId: "USR_TEST",
        email,
        role: guestAcc.role,
        displayName: guestAcc.displayName
      };
      res.json({ token: generateToken(user), user });
      return;
    }
    res.status(401).json({ error: "Invalid credentials" });
  });

  app.get("/api/auth/verify", authGuard, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  app.get("/api/presets/:id", authGuard, (req, res) => {
    if (req.params.id === "crisis") {
      res.json({ id: "crisis", rows: PRESET_CRISIS_DAY });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.post("/api/briefing/analyze", authGuard, async (req: AuthenticatedRequest, res) => {
    const { presetId } = req.body;
    const preparsed = presetId === "crisis" ? PRESET_CRISIS_DAY : undefined;
    const result = await analyzeCivicDataProxy({}, preparsed);
    res.json(result);
  });

  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(3099, () => resolve()));
  console.log("▶ Test server running on http://localhost:3099\n");

  const baseUrl = "http://localhost:3099";

  try {
    // 3. Test 1-Click Guest Login
    console.log("▶ Testing POST /api/auth/login (1-Click Guest Login)...");
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "guest.officer@civicstudio.in",
        password: "CivicBrief#2026"
      })
    });
    assert(loginRes.status === 200, `Login returns status 200 (got ${loginRes.status})`);
    const loginData = (await loginRes.json()) as any;
    assert(!!loginData.token, "Returns signed JWT token");
    assert(loginData.user.role === "ward_officer", "User role is ward_officer");
    const token = loginData.token;

    // 4. Test Token Verification
    console.log("\n▶ Testing GET /api/auth/verify...");
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(verifyRes.status === 200, "Token verification passes with 200 OK");

    // 5. Test Unauthorized Access Guard
    console.log("\n▶ Testing Unauthorized Access (No Token)...");
    const unauthRes = await fetch(`${baseUrl}/api/presets/crisis`);
    assert(unauthRes.status === 401, "Protected route without token returns 401 Unauthorized");

    // 6. Test Presets Endpoint
    console.log("\n▶ Testing GET /api/presets/crisis...");
    const presetRes = await fetch(`${baseUrl}/api/presets/crisis`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(presetRes.status === 200, "Presets endpoint returns 200 OK");
    const presetData = (await presetRes.json()) as any;
    assert(presetData.rows.length === PRESET_CRISIS_DAY.length, `Returns full preset dataset (${presetData.rows.length} rows)`);

    // 7. Test Analysis Pipeline via API
    console.log("\n▶ Testing POST /api/briefing/analyze (Initial Call)...");
    const analyzeRes1 = await fetch(`${baseUrl}/api/briefing/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ presetId: "crisis" })
    });
    assert(analyzeRes1.status === 200, "Analysis route returns 200 OK");
    const analysis1 = (await analyzeRes1.json()) as any;
    assert(analysis1.fastTriage.alert_level === "EMERGENCY_CRITICAL", "Returns EMERGENCY_CRITICAL fast triage");
    assert(analysis1.cached === false, "First call is not from cache (cached: false)");

    // 8. Test SHA-256 LRU Cache Efficiency (Repeat Call)
    console.log("\n▶ Testing POST /api/briefing/analyze (Repeat Call for 0ms LRU Cache)...");
    const analyzeRes2 = await fetch(`${baseUrl}/api/briefing/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ presetId: "crisis" })
    });
    const analysis2 = (await analyzeRes2.json()) as any;
    assert(analysis2.cached === true, "Repeat query is served instantly from SHA-256 LRU cache (cached: true)");
    assert(analysis2.executionTimeMs < 10, `Cached response returned in ${analysis2.executionTimeMs} ms (< 10ms benchmark)`);

    // 9. Test Canonical Key Hashing (Key Order Invariance)
    console.log("\n▶ Testing Canonical Key Hashing (Key Order Invariance)...");
    const { PayloadLRUCache } = await import("../server/services/lruCache.js");
    const testCache = new PayloadLRUCache<string>(10, 100);
    const hashA = testCache.computeHash({ a: 1, b: 2, c: { x: "hello", y: "world" } });
    const hashB = testCache.computeHash({ c: { y: "world", x: "hello" }, b: 2, a: 1 });
    assert(hashA === hashB, "Identical objects with reversed key order produce identical canonical hash");

    // 10. Test TTL Expiration
    console.log("\n▶ Testing LRU Cache TTL Window Expiration...");
    testCache.set("key1", "val1");
    assert(testCache.get("key1") === "val1", "Fresh entry is returned before TTL expires");
    // Wait for 110ms past the 100ms TTL
    await new Promise(r => setTimeout(r, 120));
    assert(testCache.get("key1") === null, "Stale entry is evicted automatically after TTL window");

    console.log("\n🎉 ALL BACKEND REST API & SECURITY TESTS PASSED (10/10)!\n");
  } finally {
    testServer.close();
  }
}

runBackendApiTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
