# Custom Domain Setup Guide

This guide will help you set up a custom domain for your portfolio website hosted on GitHub Pages.

## 📋 Prerequisites

1. Domain name registered and accessible (purchase from GoDaddy, Namecheap, Google Domains, etc.)
2. GitHub repository with your website
3. Access to your domain registrar's DNS settings

## ✅ Step-by-Step Setup

### Step 1: Verify Your Domain in CNAME File

The `CNAME` file in your repository should contain:
```
yourdomainname.com
```

Replace `yourdomainname.com` with your actual custom domain.

### Step 2: Configure GitHub Pages

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
   - Branch: Select `main` (or your deployment branch)
   - Folder: Select `/ (root)`
4. Under "Custom domain":
   - Enter your domain: `yourdomainname.com`
   - Click **Save**
5. Check **Enforce HTTPS** (wait for certificate generation - may take 24 hours)

GitHub will automatically create/update the CNAME file.

### Step 3: Update DNS Records at Your Registrar

You have two options:

#### Option A: Using A Records (Recommended)

1. Log into your domain registrar
2. Navigate to **DNS Settings** or **DNS Management**
3. Add these four A records:

   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | A | @ | 185.199.108.153 | 3600 |
   | A | @ | 185.199.109.153 | 3600 |
   | A | @ | 185.199.110.153 | 3600 |
   | A | @ | 185.199.111.153 | 3600 |

4. Optional: Add CNAME for www subdomain:

   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | CNAME | www | yourusername.github.io | 3600 |

#### Option B: Using CNAME Record

1. Log into your domain registrar
2. Navigate to **DNS Settings**
3. Add this CNAME record:

   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | CNAME | @ | MitkoMitrov.github.io | 3600 |

**Note**: Some registrars don't allow CNAME on the root domain. In that case, use Option A.

### Step 4: Verify DNS Configuration

After updating DNS records, verify them:

1. **Using Command Line** (Windows PowerShell):
```powershell
nslookup yourdomainname.com
# or
nslookup www.yourdomainname.com
```

2. **Using Online Tools**:
   - [MX Toolbox](https://mxtoolbox.com/mxlookup.aspx)
   - [DNS Checker](https://dnschecker.org/)
   - [Whatsmydns](https://www.whatsmydns.net/)

Expected results:
- Should point to GitHub Pages IP addresses or MitkoMitrov.github.io

### Step 5: Wait for Propagation

DNS changes can take 5 minutes to 48 hours to propagate globally.

**Monitor progress**:
1. Check your domain: `https://yourdomainname.com`
2. Check www subdomain: `https://www.yourdomainname.com`
3. Use DNS propagation checkers (linked above)

### Step 6: Enable HTTPS

Once DNS is propagated:

1. Go to GitHub repository → **Settings** → **Pages**
2. Check **Enforce HTTPS**
3. Wait for SSL certificate generation (usually 24 hours)

Your site will now be accessible at:
- `https://yourdomainname.com`
- `https://www.yourdomainname.com`

## 🔧 Troubleshooting

### Site Still Shows GitHub Pages Default

**Solution**: 
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito/private mode
- Wait for DNS propagation

### SSL Certificate Not Issuing

**Solution**:
- Ensure DNS records are correctly configured
- Wait up to 24 hours for certificate generation
- Check GitHub Pages settings for errors

### Redirects Not Working

**Solution**:
- Verify CNAME file exists in repository
- Check DNS A records are all four IPs (if using A records)
- Ensure GitHub Pages is set to deploy from correct branch

### Can't Resolve Domain

**Solution**:
```powershell
# Clear DNS cache (Windows)
ipconfig /flushdns

# On Mac
sudo dscacheutil -flushcache

# On Linux
sudo systemctl restart systemd-resolved
```

## 📧 Common Registrar Instructions

### GoDaddy
1. Log in → **My Products** → **Domains**
2. Select your domain → **Manage DNS**
3. Add A records or CNAME record

### Namecheap
1. Log in → **Domain List** → **Manage**
2. Go to **Advanced DNS** tab
3. Add A records or CNAME record

### Google Domains
1. Log in → **Manage** your domain
2. Click **DNS** in left sidebar
3. Scroll to **Custom records**
4. Add A records or CNAME record

### Bluehost
1. Log in → **Domains**
2. Select your domain → **Manage DNS**
3. Add A records or CNAME record

## 🔒 HTTPS/SSL Certificate

Once DNS is set up correctly:
1. Go to GitHub Pages settings
2. **Enforce HTTPS** option becomes available
3. Enable it (SSL certificate will be issued automatically)
4. Wait 1-24 hours for certificate generation

## ✨ Final Checklist

- [ ] Domain registered and accessible
- [ ] CNAME file updated with your domain
- [ ] GitHub Pages configured with custom domain
- [ ] DNS records added at domain registrar
- [ ] DNS propagation verified (using nslookup or online tools)
- [ ] Site accessible at custom domain
- [ ] HTTPS enforced and SSL certificate installed
- [ ] www redirect working (if configured)

## 📞 Need Help?

- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Your Registrar Support**: Check your registrar's help center
- **DNS Propagation**: Use https://www.whatsmydns.net/

---

Once configured, your portfolio will be live at your custom domain! 🎉
