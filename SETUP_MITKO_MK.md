# DNS Setup Guide for mitko.mk with GitHub Pages

## Your Domain: mitko.mk
## Registrar: zemi.mk

---

## Important: Don't Change Nameservers! ⚠️

**Your registrar is telling you to change nameservers to use their DNS zone, BUT for GitHub Pages, you should keep your current nameservers and just add DNS records instead.**

Changing nameservers to `n30.zemi.mk` and `n31.zemi.mk` will give you access to manage DNS records, which is what you need.

---

## Step-by-Step Setup

### Step 1: Access DNS Zone Management

1. Log in to your zemi.mk account
2. Find your domain `mitko.mk`
3. Make sure nameservers are set to:
   - `n30.zemi.mk`
   - `n31.zemi.mk`
4. Access the DNS Zone / DNS Records section

### Step 2: Add GitHub Pages DNS Records

You need to add **5 DNS records total** (4 A records + 1 CNAME record):

| Name | TTL | Type | Address/Data |
|------|-----|------|--------------|
| @ | 3600 | A | 185.199.108.153 |
| @ | 3600 | A | 185.199.109.153 |
| @ | 3600 | A | 185.199.110.153 |
| @ | 3600 | A | 185.199.111.153 |
| www | 3600 | CNAME | mitkomitrov.github.io. |

**Notes**: 
- `@` = your root domain (mitko.mk) - some DNS panels may want this field empty
- TTL `3600` = 1 hour (standard setting)
- The `.` (dot) at the end of `mitkomitrov.github.io.` may be optional depending on your DNS panel

---

## Step 3: Verify DNS Configuration

After adding the records, wait 5-60 minutes, then verify:

### Using Command Line (PowerShell):
```powershell
# Check A records
nslookup mitko.mk

# Check CNAME record
nslookup www.mitko.mk

# Detailed DNS query
Resolve-DnsName mitko.mk -Type A
Resolve-DnsName www.mitko.mk -Type CNAME
```

### Expected Results:
- `mitko.mk` should return the 4 GitHub IP addresses
- `www.mitko.mk` should return CNAME pointing to `mitkomitrov.github.io`

---

## Step 4: Configure GitHub Pages

1. Go to your GitHub repository: `https://github.com/mitkomitrov/mitkomitrov.github.io`
2. Click **Settings**
3. Scroll down to **Pages** section (in left sidebar)
4. Under "Custom domain", enter: `mitko.mk`
5. Click **Save**
6. Wait a few minutes, then check the box **Enforce HTTPS**

---

## Troubleshooting

### Issue: "DNS check unsuccessful"
**Solution**: Wait longer (up to 24 hours for full DNS propagation), but usually works within 1 hour.

### Issue: "Domain is already taken"
**Solution**: Make sure no other GitHub repository is using `mitko.mk`. You can only use a domain on one GitHub Pages site.

### Issue: HTTPS not available
**Solution**: 
1. Wait 24 hours after DNS is configured
2. GitHub needs to provision SSL certificate
3. Try unchecking and re-checking "Enforce HTTPS"

### Issue: Website shows 404
**Solution**:
1. Verify CNAME file contains only: `mitko.mk`
2. Check repository is named exactly: `mitkomitrov.github.io`
3. Verify repository is public
4. Check GitHub Pages is enabled in Settings

---

## What Your DNS Records Should Look Like

After setup, your DNS zone should have:

```
; Root domain - points to GitHub Pages
mitko.mk.           IN  A     185.199.108.153
mitko.mk.           IN  A     185.199.109.153
mitko.mk.           IN  A     185.199.110.153
mitko.mk.           IN  A     185.199.111.153

; WWW subdomain - points to your GitHub Pages
www.mitko.mk.       IN  CNAME mitkomitrov.github.io.
```

---

## Timeline

- **Immediate**: GitHub recognizes your domain after you save in Settings
- **5-60 minutes**: DNS changes propagate (usually fast)
- **Up to 24 hours**: Full global DNS propagation
- **Up to 24 hours**: HTTPS certificate provisioning

---

## Testing Your Setup

### Test 1: Check DNS
```powershell
nslookup mitko.mk
```
Should show GitHub IP addresses (185.199.108.153, etc.)

### Test 2: Check WWW
```powershell
nslookup www.mitko.mk
```
Should show CNAME to mitkomitrov.github.io

### Test 3: Access Website
Open browser and go to:
- http://mitko.mk
- http://www.mitko.mk
- https://mitko.mk (after HTTPS is enabled)
- https://www.mitko.mk (after HTTPS is enabled)

All should redirect to your portfolio!

---

## Quick Checklist

- [ ] Nameservers set to n30.zemi.mk and n31.zemi.mk
- [ ] 4 A records added for mitko.mk pointing to GitHub IPs
- [ ] 1 CNAME record added for www.mitko.mk pointing to mitkomitrov.github.io
- [ ] CNAME file in repository contains "mitko.mk"
- [ ] Custom domain added in GitHub Pages settings
- [ ] Waited at least 1 hour for DNS propagation
- [ ] HTTPS enabled in GitHub Pages settings

---

## Visual Guide for zemi.mk DNS Panel

When you access your DNS zone at zemi.mk, you'll likely see a form like this:

**Adding A Record:**
```
Record Type: [A        ▼]
Name/Host:   [@         ]  or leave empty
Value:       [185.199.108.153]
TTL:         [3600      ]
[Add Record]
```

Repeat 4 times with each GitHub IP address.

**Adding CNAME Record:**
```
Record Type: [CNAME    ▼]
Name/Host:   [www       ]
Value:       [mitkomitrov.github.io.]
TTL:         [3600      ]
[Add Record]
```

---

## After DNS Propagates

Once DNS is working (test with `nslookup mitko.mk`), your portfolio will be accessible at:

✅ **mitko.mk** - Your main domain
✅ **www.mitko.mk** - Automatically redirects to mitko.mk
✅ **https://mitko.mk** - Secure HTTPS (after certificate is issued)

The old URL `mitkomitrov.github.io` will still work but should redirect to `mitko.mk`.

---

## Need Help?

If you encounter any issues:

1. **Check DNS propagation**: https://dnschecker.org (enter mitko.mk)
2. **Verify GitHub settings**: Repository Settings → Pages
3. **Check CNAME file**: Should contain only "mitko.mk" (no www, no https://)
4. **Wait**: DNS can take up to 24 hours in rare cases

---

**Your domain is already configured in the CNAME file! ✅**
**Now just add the DNS records at zemi.mk and enable it in GitHub Pages settings.**
