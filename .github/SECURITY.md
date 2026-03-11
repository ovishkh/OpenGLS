# Security Policy

## Supported Versions

We release security patches for the following versions:

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅ Yes    |
| < 1.0   | ❌ No     |

## Reporting a Vulnerability

**Do not open public issues for security vulnerabilities.** Instead:

1. **Email** the maintainers at: [create a private security contact]
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

3. **Wait** for acknowledgment (typically within 48 hours)
4. We will:
   - Investigate and confirm the issue
   - Develop a fix
   - Coordinate a security release
   - Credit you (with permission) in release notes

## Security Considerations

### Client-Side Only

OpenGLS is a **client-side, browser-native application**. Security implications are minimal:

- No backend server
- No data persistence or networking
- All code runs locally in your browser

### Code Execution Risks

The parser accepts arbitrary C++/OpenGL-like code. However:

- ✅ Code runs in a sandboxed browser context
- ✅ No system access or file I/O
- ✅ Limited to canvas drawing operations
- ✅ Input is never evaluated as JavaScript

### Best Practices

1. **Keep dependencies up to date**: `npm audit` regularly
2. **Report issues privately**: Never post exploits publicly
3. **Use HTTPS**: Always deploy over secure connections
4. **Content Security Policy**: Implement CSP headers (recommended for production)

## Dependency Audits

```bash
npm audit              # Check for vulnerabilities
npm audit fix          # Apply patches (non-breaking)
npm audit fix --force  # Apply all patches (may break things)
```

## Verifying Releases

We sign releases with GPG keys. Verify before using production builds.

---

**Thank you for helping keep OpenGLS secure!**
