# Security Policy

**Last Updated:** 2025-10-27
**Last Audit:** 2025-10-27 ([Full Audit Report](docs/audits/2025-10-27/))

---

## 🔒 Our Security Commitment

textMan is committed to maintaining the highest security standards for our users. We take security seriously and appreciate the community's help in keeping textMan safe.

### Core Security Principles

1. **Client-Side First** - All processing happens in the browser, no data sent to servers
2. **Transparency** - Open source code, auditable by anyone
3. **Privacy by Design** - No tracking, no analytics, no cookies
4. **Regular Audits** - Quarterly security audits conducted
5. **Fast Response** - Security issues addressed within 48-72 hours

---

## 🚨 Known Vulnerabilities & Active Remediation

### Critical Issues (Being Fixed)

Based on our [2025-10-27 Security Audit](docs/audits/2025-10-27/CODEBASE_AUDIT.md), we are actively working to remediate the following issues:

#### SEC-001: Unvalidated innerHTML Injection (XSS) - **CRITICAL** 🔴
**Status:** 🔄 In Remediation (Scheduled: Next session)
**Risk:** HIGH - Arbitrary JavaScript execution possible
**Affected Versions:** v2.1a.0 and earlier
**CVE:** Pending

**Description:**
Multiple locations in the codebase use `innerHTML` with unsanitized user input, creating XSS vulnerabilities.

**Affected Components:**
- Toast notification system (js/scripts.js:273-282)
- Modal dialogs (js/scripts.js:360-363)
- History rendering (js/scripts.js:1351-1365)
- Additional locations (10+ instances)

**Exploitation Risk:**
An attacker could inject malicious scripts through:
- User-provided text input
- Compromised localStorage data
- Crafted saved texts/templates

**Mitigation Until Fixed:**
- Avoid importing untrusted files
- Clear localStorage if suspicious behavior observed
- Use incognito/private browsing for sensitive text

**Timeline:**
- **Fix Target:** 2025-11-01
- **Testing:** 2025-11-02
- **Release:** 2025-11-03 (v2.1.1)

---

#### SEC-002: HTML Decode XSS Vulnerability - **CRITICAL** 🔴
**Status:** 🔄 In Remediation (Scheduled: Next session)
**Risk:** HIGH - XSS via HTML decode function
**Affected Versions:** v2.1a.0 and earlier
**CVE:** Pending

**Description:**
The HTML decode feature uses `innerHTML` to decode HTML entities, creating an XSS vector.

**Location:** js/scripts.js:816-825 (TextTools.decodeHTML)

**Attack Vector:**
```html
<!-- User inputs: -->
<img src=x onerror=alert('XSS')>
<!-- Gets executed during decode -->
```

**Timeline:**
- **Fix Target:** 2025-11-01
- **Testing:** 2025-11-02
- **Release:** 2025-11-03 (v2.1.1)

---

#### SEC-003: LocalStorage Injection - **CRITICAL** 🔴
**Status:** 🔄 In Remediation (Scheduled: Next session)
**Risk:** HIGH - No validation on stored data
**Affected Versions:** v2.1a.0 and earlier
**CVE:** Pending

**Description:**
Data loaded from localStorage is not validated or sanitized before being rendered, allowing malicious data injection if localStorage is compromised.

**Location:** js/scripts.js:138-166 (Storage.load)

**Attack Scenario:**
1. XSS vulnerability exploited
2. Attacker injects malicious data into localStorage
3. Data persists and executes on every page load

**Timeline:**
- **Fix Target:** 2025-11-01
- **Testing:** 2025-11-02
- **Release:** 2025-11-03 (v2.1.1)

---

### High Priority Issues

#### SEC-004: Unsafe btoa/atob Usage - **HIGH** 🟠
**Status:** 📋 Planned
**Risk:** MEDIUM - Unicode characters cause crashes
**Timeline:** 2025-11-05

#### SEC-005: Missing Content Security Policy - **HIGH** 🟠
**Status:** 📋 Planned
**Risk:** MEDIUM - No CSP headers reduce defense-in-depth
**Timeline:** 2025-11-05

#### SEC-006: Unvalidated File Uploads - **HIGH** 🟠
**Status:** 📋 Planned
**Risk:** MEDIUM - No MIME type or content validation
**Timeline:** 2025-11-08

---

## 🛡️ Supported Versions

| Version | Supported          | Notes |
| ------- | ------------------ | ----- |
| 2.1.x   | :white_check_mark: | Current, security fixes in progress |
| 2.0.x   | :x:                | Upgrade to 2.1.x |
| < 2.0   | :x:                | No longer supported |

**Current Version:** v2.1a.0
**Next Security Release:** v2.1.1 (Target: 2025-11-03)

---

## 📢 Reporting a Vulnerability

### Please Report Security Issues Responsibly

If you discover a security vulnerability, please follow these steps:

### 1. **DO NOT** Create a Public Issue

Security vulnerabilities should NOT be reported via public GitHub issues. This protects users until a fix is available.

### 2. Report Privately

**Preferred Method:** Email security report to:
- **Email:** security@textman.dev (or project maintainer email)
- **Subject:** `[SECURITY] Brief description`

**Alternative Method:** GitHub Security Advisories
- Go to: https://github.com/[your-org]/textMan/security/advisories
- Click "New draft security advisory"

### 3. Include These Details

```
**Summary:** Brief description of the vulnerability

**Type:** XSS / Injection / Authentication / etc.

**Affected Component:** Which file/function is vulnerable

**Severity:** Critical / High / Medium / Low (your assessment)

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error...

**Impact:** What can an attacker do with this vulnerability?

**Proof of Concept:** (Code example or screenshot)

**Suggested Fix:** (Optional, but helpful)

**Discoverer:** Your name (for credit in release notes)
```

### 4. Response Timeline

We aim to respond within:
- **24 hours:** Initial acknowledgment
- **72 hours:** Severity assessment and timeline
- **7-14 days:** Fix development and testing
- **14-21 days:** Security release

### 5. Disclosure Policy

- We request **90 days** before public disclosure
- We will credit you in release notes (unless you prefer anonymity)
- We may award bounties for critical vulnerabilities (if budget allows)

---

## 🔐 Security Best Practices for Contributors

### When Contributing Code

1. **Never use `innerHTML` or `outerHTML`**
   - ❌ `element.innerHTML = userInput`
   - ✅ `element.textContent = userInput`
   - ✅ Use `createElement()` and DOM APIs

2. **Always sanitize user input**
   - Validate before processing
   - Escape before rendering
   - Use allowlists, not blocklists

3. **Validate localStorage data**
   - Check structure and types
   - Handle malformed data gracefully
   - Consider using schema validation

4. **Be cautious with encoding/decoding**
   - Use proper Unicode-safe methods
   - Don't use `eval()` or `Function()` constructor
   - Validate encoded data before decoding

5. **Follow the principle of least privilege**
   - Request minimal permissions
   - Validate all inputs
   - Fail securely (don't expose error details to users)

### Security Checklist for PRs

Before submitting a PR, ensure:

- [ ] No `innerHTML`, `outerHTML`, or `eval()` usage
- [ ] User input is sanitized
- [ ] localStorage data is validated
- [ ] No hardcoded secrets or API keys
- [ ] Error messages don't expose sensitive info
- [ ] Security-sensitive changes have unit tests
- [ ] Dependencies are up-to-date (no known vulnerabilities)

---

## 🔍 Security Audit History

### 2025-10-27: Initial Comprehensive Security Audit
**Auditor:** Claude (Sonnet 4.5)
**Scope:** Complete codebase (6,382 lines)
**Findings:** 28 total issues (3 Critical, 7 High, 14 Medium, 4 Low)
**Report:** [View Full Audit](docs/audits/2025-10-27/)

**Critical Findings:**
- SEC-001: innerHTML XSS (10+ locations)
- SEC-002: HTML decode XSS
- SEC-003: localStorage injection

**Status:** All critical issues scheduled for remediation in v2.1.1

---

## 🛠️ Security Features

### Current Protections

✅ **Client-Side Only**
- No server communication (except CDN for Font Awesome)
- All processing happens in browser
- No data transmission to third parties

✅ **Local Storage Only**
- Data stays on your device
- No cloud storage
- Same-origin policy protection

✅ **No Tracking**
- No analytics
- No cookies
- No user profiling

✅ **Open Source**
- Code is auditable
- Community can review for security issues
- Transparent development process

### Upcoming Security Features (v2.1.1+)

🔄 **Content Security Policy (CSP)**
- Prevent inline script execution
- Whitelist allowed resources
- Report violations

🔄 **Input Sanitization**
- DOMPurify library integration
- Automatic HTML sanitization
- Safe-by-default APIs

🔄 **localStorage Validation**
- JSON Schema validation
- Type checking
- Integrity verification (HMAC)

🔄 **Enhanced File Upload Security**
- MIME type validation
- Content scanning
- File size limits (5MB recommended)

---

## 🎯 Roadmap

### Immediate (v2.1.1 - Target: 2025-11-03)
- Fix SEC-001 (innerHTML XSS) ← **Top Priority**
- Fix SEC-002 (HTML decode XSS)
- Fix SEC-003 (localStorage validation)

### Short-term (v2.2.0 - Target: 2025-11-15)
- Implement Content Security Policy (SEC-005)
- Fix btoa/atob Unicode handling (SEC-004)
- Add file upload validation (SEC-006)
- Add automated security testing (SAST)

### Medium-term (v2.3.0 - Target: 2025-12-15)
- Penetration testing
- Bug bounty program
- Security.txt file

### Long-term (v3.0.0 - Target: 2026-Q1)
- Security audit by professional firm
- Advanced cryptography research
- Enhanced data integrity verification

---

## 📚 Security Resources

### For Developers
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Guide](https://content-security-policy.com/)
- [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

### For Users
- Use modern, updated browsers
- Clear localStorage if suspicious behavior
- Don't import files from untrusted sources
- Use incognito mode for sensitive text editing

---

## 📞 Contact

**Security Issues:** security@textman.dev (or maintainer email)
**General Questions:** [GitHub Discussions](https://github.com/[your-org]/textMan/discussions)
**Bug Reports:** [GitHub Issues](https://github.com/[your-org]/textMan/issues) (for non-security bugs)

---

## 🙏 Acknowledgments

We thank the following security researchers and contributors:

- **2025-10-27:** Claude (Sonnet 4.5) - Initial comprehensive security audit (28 issues identified)

*Your name could be here! Report security issues responsibly.*

---

**Last Updated:** 2025-10-27
**Next Audit Due:** 2026-01-27 (Quarterly)

*This security policy is maintained as part of our commitment to transparent, secure software development.*
