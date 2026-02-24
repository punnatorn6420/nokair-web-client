# SECURITY + SSR POC Test Plan

**เอกสารนี้อยู่ที่:** `docs/SECURITY_SSR_POC_TEST_PLAN.md`  
**โปรเจกต์:** Next.js App Router (TypeScript, Tailwind, shadcn/ui)  
**วัตถุประสงค์:** ใช้ทดสอบ + อธิบายผล + present ทีม สำหรับ POC ด้าน SSR, baseline security, และ state/session

---

## A) Executive Summary

POC นี้ตั้งใจพิสูจน์ 4 เรื่องหลักในระดับ **local/dev และ production build ระดับแอป**:
1. หน้า SSR render จริงจาก server (ไม่ใช่ hydration-only)
2. API มี baseline ป้องกัน request bomb/bot เบื้องต้น (validation + in-memory rate limit + 429)
3. แนวทาง state management ที่ปลอดภัยสำหรับ auth/session (HttpOnly cookie mock flow)
4. เปรียบเทียบ behavior ระหว่าง SSR (`/ssr-check`) กับ non-SSR/CSR (`/csr-check` เป็น optional addition)

### สิ่งที่พิสูจน์ได้จาก POC นี้
- SSR proof จาก server-rendered HTML, terminal log, และการปิด JavaScript แล้วยังเห็น content
- baseline API hardening (input validation, 429 rate limit, sanitized error)
- auth mock flow ผ่าน HttpOnly cookie (อ่านค่าตรงจาก JS client ไม่ได้)
- baseline security headers จาก middleware

### สิ่งที่ยังพิสูจน์ไม่ได้ (ต้องทำใน production infra จริง)
- การรับมือ DDoS/distributed attack จริง
- ความสามารถระดับ WAF/CDN edge filtering
- distributed/global rate limit (Redis/edge store)
- observability/alerting ที่ครบสำหรับ incident response

---

## B) Scope / Non-scope

## Scope
- SSR proof ด้วยหน้า `/ssr-check`
- Basic anti-bomb ที่ `/api/mock-search` (validation + rate limit + 429)
- HttpOnly cookie mock auth (`/api/auth/mock-login`, `/api/auth/mock-logout`)
- Security headers baseline ผ่าน middleware

## Non-scope
- Distributed rate limit (เช่น Redis cluster)
- WAF/CDN integration และ anti-DDoS ระดับ infra
- Production hardening ครบชุด (bot management, secret rotation, key mgmt)
- Real IAM/auth provider integration (OIDC/SAML/3rd-party)
- Full observability stack (centralized logging/metrics/tracing/alert)

---

## C) System-under-test Map (Code-to-goal mapping)

> ตารางนี้อ้างอิงจาก implementation จริงใน repo ปัจจุบัน

| Goal | File Path | Component / Function Name | Purpose | How to verify | Expected result |
|---|---|---|---|---|---|
| SSR | `src/app/ssr-check/page.tsx` | `SSRCheckPage` | หน้า proof SSR หลัก แสดง `renderedAt`, `requestId`, session state | Refresh หน้า, ดู terminal, View Source, ปิด JS | พบค่า render ฝั่ง server ใน HTML ทันที |
| SSR | `src/app/ssr-check/page.tsx` | `dynamic = "force-dynamic"` | บังคับ dynamic rendering ต่อ request | Refresh หลายครั้ง | `requestId`/`renderedAt` เปลี่ยนทุกครั้ง |
| SSR + API integration | `src/app/ssr-check/page.tsx` | `fetchMockSearch(host)` | ทำ server-side fetch ไป `/api/mock-search` แบบ `cache: "no-store"` | ดูผล JSON บนหน้า + ดู network document | ผลจาก API ถูก render มาพร้อม HTML |
| SSR observability | `src/app/ssr-check/page.tsx` | `console.log("[SSR_CHECK_RENDER]", ...)` | ทิ้ง log marker สำหรับพิสูจน์ server render | ดู terminal ตอน reload | มี log ทุก request |
| Bot/Bomb baseline | `src/app/api/mock-search/route.ts` | `GET(request)` | route handler หลักสำหรับค้นหา mock | ยิงปกติ/ยิงถี่/ยิง invalid input | ได้ 200/429/400 ตามเงื่อนไข |
| Bot/Bomb baseline | `src/lib/security/rate-limit.ts` | `applyRateLimit` | In-memory fixed-window limiter | ยิงเกิน limit ในช่วงเวลาเดียวกัน | ถูก block และมี retry hint |
| Bot/Bomb baseline | `src/lib/security/rate-limit.ts` | `getClientIp` | แยก key limiter ตาม IP (`x-forwarded-for`/`x-real-ip`) | ส่ง header IP ต่างกัน | limiter แยกตาม key IP |
| Validation | `src/lib/security/validation.ts` | `validateSearchQuery` | validate `q` (type, min/max length) | ส่ง `q` สั้นเกิน/ยาวเกิน/ไม่ส่ง | 400 พร้อมข้อความ validation |
| Error hygiene | `src/app/api/mock-search/route.ts` | `catch` block + JSON error | ป้องกัน stack trace หลุดสู่ client | บังคับ error/ดูรูปแบบ response | ได้ message generic |
| Auth/session | `src/app/api/auth/mock-login/route.ts` | `POST`, `resolveUsername`, `wantsHtmlRedirect` | mock login + set HttpOnly cookie + รองรับ form/json | กดปุ่ม login หรือ POST API | cookie ถูก set, response redirect/json ตาม caller |
| Auth/session | `src/app/api/auth/mock-logout/route.ts` | `POST` | clear cookie + redirect | กดปุ่ม logout | cookie หมดอายุ/หายไป |
| Auth/session | `src/lib/security/auth.ts` | `MOCK_SESSION_COOKIE`, `createMockSessionValue` | สร้างชื่อคุกกี้และค่า session แบบ sanitize + nonce | login หลายรอบ | ค่า cookie format `safeName.uuid` |
| Security headers | `src/lib/security/headers.ts` | `applySecurityHeaders` | ใส่ baseline security headers | ตรวจ response headers | พบ headers ที่กำหนด |
| Security headers + API cache control | `src/middleware.ts` | `middleware`, `config.matcher` | apply headers ทุก route ที่ matcher ครอบคลุม + `Cache-Control: no-store` สำหรับ `/api/*` | `curl -I` หรือ DevTools | header ถูกแนบสม่ำเสมอ |

---

## D) Test Strategy

## 1) SSR Verification
- **Objective:** ยืนยันว่า `/ssr-check` render จาก server จริง
- **Preconditions:** รันแอปได้ (`npm run dev` หรือ `npm run build && npm run start`)
- **Steps:** refresh, ดู terminal log, View Source, ปิด JS, ตรวจ network document
- **Expected Result:** ค่า dynamic (`Server Rendered At`, `Request ID`, API result) ปรากฏใน HTML ตั้งแต่ initial response
- **Evidence to capture:** screenshot หน้า, terminal, View Source, Disable JS result, Network response

## 2) Bot/Bomb Protection Verification
- **Objective:** ยืนยัน baseline protection ของ `/api/mock-search`
- **Preconditions:** API route เข้าถึงได้
- **Steps:** ยิงปกติให้ได้ 200, ยิงถี่ให้ได้ 429, ส่ง invalid input ให้ได้ 400
- **Expected Result:** response และ status code ตรงกับเงื่อนไข, ไม่มี stack trace รั่ว
- **Evidence to capture:** terminal command output, network response JSON/headers

## 3) State / Session Security Verification
- **Objective:** ยืนยัน mock auth ใช้ HttpOnly cookie และ SSR อ่าน session ได้
- **Preconditions:** เข้า `/ssr-check` ได้
- **Steps:** login/logout ผ่านฟอร์ม, ตรวจ cookie, ตรวจ local/session storage, refresh หน้า
- **Expected Result:** session state บนหน้าเปลี่ยนตาม cookie; token ไม่อยู่ localStorage/sessionStorage
- **Evidence to capture:** screenshot cookies/storage + UI state ก่อน/หลัง

## 4) SSR vs Non-SSR Comparison Verification
- **Objective:** เปรียบเทียบพฤติกรรม SSR vs CSR อย่างเป็นระบบ
- **Preconditions:** มี `/ssr-check`; `/csr-check` ถ้ายังไม่มีให้ใช้เป็น optional action item
- **Steps:** เทียบ View Source, Disable JS, Network pattern, initial content, SEO readability
- **Expected Result:** เห็น trade-off ชัดเจนทั้งฝั่ง UX/SEO/cost/security
- **Evidence to capture:** side-by-side screenshot + network capture

---

## E) Detailed Test Cases (Step-by-step)

## [E1] SSR Proof (`/ssr-check`)

### วัตถุประสงค์
พิสูจน์ว่า HTML หลักถูก render ที่ server ไม่ใช่รอ client JS fetch ก่อน

### ขั้นตอนละเอียด
1. เปิด terminal แล้วรันแอป
   - Dev: `npm run dev`
   - หรือ production mode: `npm run build && npm run start`
2. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000/ssr-check`
3. รีเฟรชหน้า 2-3 ครั้ง แล้วดู terminal
   - ต้องเห็น log marker: `[SSR_CHECK_RENDER]`
4. เปิด **View Page Source**
   - Chrome/Edge: คลิกขวา > *View page source* (หรือ `Ctrl/Cmd + U`)
   - ค้นหา string: `Server Rendered At`, `Request ID`, และ payload จาก mock search
5. ปิด JavaScript ชั่วคราว
   - DevTools > Command menu (`Ctrl/Cmd + Shift + P`) > พิมพ์ `Disable JavaScript` > Enter
   - กลับหน้า `/ssr-check` แล้ว refresh
6. เปิด DevTools > Network > คลิก request ประเภท `document`
   - ตรวจ tab **Response** ว่ามีค่าที่ render แล้วอยู่ใน HTML

### Expected Result
- พบ log `[SSR_CHECK_RENDER]` ทุกครั้งที่ reload
- View Source มีค่า `Server Rendered At`, `Request ID`, mock search JSON
- ปิด JS แล้วยังเห็นข้อมูลสำคัญบนหน้า
- document response มี rendered values แล้ว

### ผลลัพธ์แต่ละข้อพิสูจน์อะไร
- **Terminal log:** server code path ถูก execute ต่อ request
- **View Source มีค่า render แล้ว:** SSR จริง (ไม่ใช่ shell ว่าง + client fetch)
- **Disable JS แล้วยังใช้งานได้:** initial content ไม่พึ่ง JS runtime
- **Network document มีข้อมูล:** content อยู่ใน initial HTML จาก server response

---

## [E2] Bot/Bomb Baseline (`/api/mock-search`)

### วัตถุประสงค์
ยืนยัน baseline ป้องกัน request ถี่ + input ผิดรูปแบบ

### 1) ทดสอบ normal request (200)

**Browser:**
- เปิด `http://localhost:3000/api/mock-search?q=hello`
- ควรเห็น JSON `ok: true`

**curl (mac/Linux/Git Bash):**
```bash
curl -i "http://localhost:3000/api/mock-search?q=hello"
```

**PowerShell (Windows):**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/mock-search?q=hello" -Method GET
```

### 2) ทดสอบยิงถี่จนได้ 429

**curl loop (mac/Linux/Git Bash):**
```bash
for i in {1..8}; do curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/mock-search?q=bomb"; done
```

**PowerShell loop:**
```powershell
1..8 | ForEach-Object {
  (Invoke-WebRequest -Uri "http://localhost:3000/api/mock-search?q=bomb" -Method GET -SkipHttpErrorCheck).StatusCode
}
```

### 3) ทดสอบ invalid input (400)

**ตัวอย่างไม่ส่ง q:**
```bash
curl -i "http://localhost:3000/api/mock-search"
```

**ตัวอย่าง q สั้นเกิน:**
```bash
curl -i "http://localhost:3000/api/mock-search?q=a"
```

### 4) ตรวจ sanitized response
- ตรวจว่า response error เป็นรูปแบบ:
  - `error: "invalid_input"` หรือ `error: "internal_error"`
  - ไม่มี stack trace หรือ path ภายในโค้ด

### Expected Result
- request ปกติ: 200 + `ok: true`
- ยิงเกิน limit ใน window เดียวกัน: 429 + `Retry-After`
- input ไม่ผ่าน validation: 400 + message ที่อ่านได้
- response error ไม่ leak รายละเอียดระบบภายใน

---

## [E3] State / Session Security (Mock Login/Logout)

### วัตถุประสงค์
ยืนยันว่า session mock อยู่ใน HttpOnly cookie และ SSR อ่าน session จาก cookie ได้

### ขั้นตอนละเอียด
1. เข้า `/ssr-check` และสังเกตบรรทัด `Mock Session`
2. กดปุ่ม **Mock Login (set HttpOnly cookie)**
3. หลัง redirect กลับ `/ssr-check`
   - ควรเห็น `Mock Session: Logged in (HttpOnly cookie exists)`
4. เปิด DevTools > **Application** > **Cookies** > domain `localhost`
   - มองหา cookie ชื่อ `mock_session`
   - ตรวจ flag สำคัญ: `HttpOnly`, `SameSite=Lax`, `Path=/`
5. เปิด DevTools Console แล้วลอง:
   ```js
   document.cookie
   ```
   - ควร **ไม่เห็นค่า** `mock_session` ในผลลัพธ์ (เพราะ HttpOnly)
6. ตรวจ **Local Storage** และ **Session Storage**
   - ต้องไม่มี token/session ลักษณะ auth ถูกเก็บไว้
7. กดปุ่ม **Mock Logout (clear cookie)**
   - ควรถูก redirect กลับ `/ssr-check`
   - `Mock Session` เปลี่ยนเป็น `Not logged in`

### HttpOnly พิสูจน์อะไร
- หมายความว่า JavaScript ฝั่ง browser อ่านค่า cookie โดยตรงไม่ได้
- ลดความเสี่ยง token โดนขโมยผ่าน XSS บางรูปแบบ
- แต่ยังต้องมีมาตรการอื่นร่วมด้วย (เช่น CSRF strategy, CSP, secure coding)

---

## [E4] Security Headers

### วัตถุประสงค์
ยืนยัน baseline security headers จาก middleware ถูกส่งออกจริง

### วิธีทดสอบผ่าน DevTools
1. เปิดหน้า `/ssr-check`
2. DevTools > Network > เลือก request `document`
3. ดู Response Headers

### วิธีทดสอบผ่าน curl
```bash
curl -I "http://localhost:3000/ssr-check"
curl -I "http://localhost:3000/api/mock-search?q=header"
```

### Header ที่คาดว่าจะเห็น
- `X-Content-Type-Options: nosniff` — ลด MIME sniffing
- `X-Frame-Options: DENY` — ป้องกัน clickjacking จาก iframe
- `Referrer-Policy: strict-origin-when-cross-origin` — จำกัด referrer leakage
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — ปิดสิทธิ์ browser API ที่ไม่จำเป็น
- `X-DNS-Prefetch-Control: off` — ลด DNS prefetch behavior
- สำหรับ `/api/*` เพิ่ม `Cache-Control: no-store` — ลดความเสี่ยง cache ข้อมูล API

---

## F) SSR vs Non-SSR Comparison (สำคัญ)

> สถานะปัจจุบัน: พบ `/ssr-check` แล้ว แต่ยังไม่พบ `/csr-check` ใน repo นี้  
> ดังนั้น `/csr-check` จะระบุเป็น **Optional Proposed Addition**

## 1) หน้าที่ใช้เทียบ
- SSR version (มีแล้ว): `/ssr-check`
- Non-SSR/CSR version (เสนอเพิ่ม): `/csr-check` (client component + `useEffect` fetch)

## 2) ความต่างเชิงพฤติกรรมที่ต้องสังเกต
- View Source
- Disable JavaScript
- Network requests (document + API)
- Initial content availability
- SEO/readability
- Cost/risk implication (SSR server cost, API exposure)

## 3) ตารางเปรียบเทียบ SSR vs Non-SSR

| Dimension | SSR behavior (`/ssr-check`) | Non-SSR behavior (`/csr-check`) | How to test | What it means for this POC |
|---|---|---|---|---|
| Initial HTML content | มี data สำคัญตั้งแต่ response แรก | มักเริ่มจาก loading shell แล้วค่อย fetch | View Source + Network document | SSR พิสูจน์ render ฝั่ง server ชัดเจน |
| JavaScript disabled | หน้า/ข้อมูลหลักยังเห็น | ส่วน fetch client อาจไม่ทำงาน | Disable JS แล้ว reload | แยกชัดว่า content พึ่ง JS หรือไม่ |
| Network pattern | server อาจ fetch data ก่อนส่ง HTML | browser ยิง API หลังโหลด JS | ดู waterfall ใน Network | CSR เพิ่ม API call ฝั่ง browser ต่อ user |
| SEO/readability | crawler อ่าน content ได้ง่ายกว่า | crawler อาจเจอ content ช้าหรือไม่ครบ | View Source | มีผลต่อ discoverability ของ content page |
| Server compute cost/request | SSR มีงาน render ที่ server ต่อ request | CSR ลดงาน render บางส่วน แต่ API ยังโดนยิงตรงได้ | load test เบื้องต้น + inspect logs | ต้องชั่ง trade-off performance/cost |
| Bot/bomb surface | SSR route โดนยิงถี่ = server render cost สูง | CSR หน้าเบาได้ แต่ API ยังต้องป้องกันเสมอ | ยิง route/API แยกกัน | ไม่ว่า SSR หรือ CSR ก็ต้องมี protection layer |

## 4) Test cases สำหรับ `/csr-check` (เมื่อมีหน้าแล้ว)

1. เปิด `/csr-check` แล้วดูว่า initial state เป็น loading/placeholder
2. เปิด View Source
   - ควรยังไม่เห็น data result เต็มแบบ SSR
3. เปิด Network
   - ควรเห็น browser call ไป API หลังหน้าโหลด
4. ปิด JavaScript แล้ว refresh
   - client-fetch ควรไม่เติมข้อมูล
5. เทียบกับ `/ssr-check` แบบ side-by-side ตามมิติในตาราง

## 5) ข้อสรุปเชิงหลักการ
- การเทียบนี้ **ไม่ได้หมายความว่า SSR ดีกว่าเสมอไป**
- จุดประสงค์คือทำให้ทีมเห็น trade-off ตาม use case (SEO, TTFB, infra cost, complexity)

## 6) ผูกกับเป้าหมาย bot/bomb
- SSR route อาจมีต้นทุน server ต่อ request สูงขึ้น → ควรมี rate limit/caching/timeout
- CSR แม้ลด SSR load ได้บางส่วน แต่ bot ยิง API ตรงได้อยู่ดี → API protection ยังจำเป็น

---

## G) State Strategy Test Notes

## แนะนำตำแหน่งเก็บ state
- **UI state** (เปิด modal, tab, filter ชั่วคราว): เก็บ client state (`useState`, หรือ lightweight store)
- **auth/session token:** เก็บใน **HttpOnly cookie** (ไม่ expose ตรงใน JS)
- **sensitive business state:** เก็บฝั่ง server/session store เมื่อจำเป็น

## ถ้าจะเทียบ no Redux vs Redux Toolkit/Zustand ใน POC ควรเทสอะไร
- ความชัดเจนของ state boundary (UI vs auth vs server data)
- โอกาสเผลอเก็บข้อมูลลับใน client store
- ความง่ายในการ reset state ตอน logout
- DX/maintainability เมื่อ flow ซับซ้อนขึ้น
- ผลกระทบต่อ testability และ debugging

## Security concern ที่ไม่เกี่ยวกับการเลือก Redux หรือไม่
- การเก็บ token ใน localStorage/sessionStorage
- CSRF/XSS defense strategy
- API authorization checks ฝั่ง server
- rate limiting, input validation, output sanitization
- secure headers และ cookie flags

## Checklist สำหรับ review state usage ใน POC
- [ ] ไม่มี auth token ใน localStorage/sessionStorage
- [ ] session อ้างอิงจาก HttpOnly cookie
- [ ] หน้า SSR อ่านสถานะ session จาก cookie/server context
- [ ] logout เคลียร์ cookie และ state ที่เกี่ยวข้อง
- [ ] ข้อมูล sensitive ไม่ถูก serialize ลง client โดยไม่จำเป็น
- [ ] API ยังบังคับ validation/authorization แม้มี client guard

---

## H) Evidence Checklist (สำหรับ present ทีม)

- [ ] Screenshot หน้า `/ssr-check`
- [ ] Screenshot terminal logs ที่มี `[SSR_CHECK_RENDER]`
- [ ] Screenshot View Source ที่เห็น rendered values
- [ ] Screenshot ผลหลัง Disable JavaScript
- [ ] Screenshot การโดน rate limit (429)
- [ ] Screenshot Cookies + Local/Session Storage
- [ ] Screenshot response headers
- [ ] (Optional) ผล verification บน production build/start
- [ ] (Optional) ถ้ามี `/csr-check`: screenshot comparison SSR vs CSR

---

## I) Pass/Fail Criteria

## SSR proof = Pass เมื่อ
- มี `[SSR_CHECK_RENDER]` ใน terminal ตอน reload
- View Source มี `Server Rendered At`, `Request ID`, และ mock search data
- ปิด JS แล้วยังเห็นข้อมูลหลักจาก server

## Anti-bomb baseline = Pass เมื่อ
- `/api/mock-search` ตอบ 200 สำหรับ request ปกติ
- ยิงเกิน threshold ได้ 429 พร้อม retry metadata
- invalid input ได้ 400 พร้อม validation message
- ไม่พบ stack trace ใน error response

## Cookie/state proof = Pass เมื่อ
- login แล้วมี `mock_session` cookie แบบ HttpOnly
- logout แล้ว cookie ถูกลบ/หมดอายุ
- หน้า `/ssr-check` แสดงสถานะตาม cookie
- ไม่พบ auth token ใน localStorage/sessionStorage

## SSR vs non-SSR comparison = Completed เมื่อ
- มีหลักฐานเทียบตามมิติหลัก (source, JS-off, network, initial content)
- มีสรุป trade-off ที่ไม่ bias ว่า SSR ดีกว่าเสมอ
- ถ้ายังไม่มี `/csr-check` ต้องมี optional plan ชัดเจน

---

## J) Known Limitations + Next Steps (Production Recommendations)

## Known limitations
- rate limit ปัจจุบันเป็น in-memory: ไม่แชร์ข้าม instance, reset เมื่อ restart
- ยังไม่มี WAF/CDN/bot-management ระดับ edge
- ยังไม่มี observability stack ที่พร้อม production incident
- ยังไม่มี timeout/circuit breaker/retry policy แบบเป็นระบบ

## Next steps ที่แนะนำ
1. ย้าย rate limiter ไป Redis/distributed store
2. เพิ่ม WAF/CDN rules และ bot filtering ที่ edge
3. วาง structured logging + metrics + alerting
4. กำหนด timeout/circuit breaker สำหรับ upstream calls
5. ทดสอบซ้ำบน production-like environment (staging ที่ topology ใกล้จริง)

---

## Optional Action Items

1. **เพิ่มหน้า `/csr-check` เพื่อ comparison ที่วัดผลได้จริง**
   - เส้นทางที่แนะนำ: `src/app/csr-check/page.tsx`
   - แนวทาง: client component (`"use client"`) + `useEffect` เรียก `/api/mock-search?q=csr-demo`
   - หน้าแสดง: loading state, fetched result, timestamp ฝั่ง client
2. **เพิ่มลิงก์นำทางระหว่าง `/ssr-check` และ `/csr-check`**
   - เพื่อให้ reviewer เทียบ behavior ได้ใน session เดียว
3. **ปรับ UX login/logout response ให้สม่ำเสมอ**
   - คงรูปแบบ redirect สำหรับ browser form submit
   - คง JSON format สำหรับ programmatic client
4. **เพิ่ม script ทดสอบอัตโนมัติแบบง่าย**
   - เช่น shell/PowerShell script ยิง API เพื่อเก็บหลักฐาน 200/400/429 อย่างเร็ว

