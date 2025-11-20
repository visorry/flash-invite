# Coolify Setup Guide for Super Invite

## HTTPS Configuration Issue

If your app doesn't support HTTPS but elite-squad does, check these Coolify settings:

### 1. Domain Configuration

In Coolify, go to your Super Invite application:

**Settings → Domains**
- Make sure you have a domain configured (e.g., `app.yourdomain.com`)
- Check "Generate Let's Encrypt Certificate" or "Use Custom Certificate"
- Ensure "Force HTTPS" is enabled

### 2. Port Configuration

**Settings → General**
- Port should be set to `30011` (matches Dockerfile.web EXPOSE)
- Make sure "Publicly Accessible" is enabled

### 3. Environment Variables

**Settings → Environment Variables**

Required for Web App:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

Required for Server App:
```
BETTER_AUTH_URL=https://api.yourdomain.com
BETTER_AUTH_SECRET=your-secret-min-32-chars
CORS_ORIGINS=https://app.yourdomain.com
COOKIE_DOMAIN=  # Leave empty or .yourdomain.com for subdomains
NODE_ENV=production
DATABASE_URL=your-postgres-url
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=@your_bot_username
```

### 4. Proxy Configuration

Coolify uses Traefik as a reverse proxy. Check:

**Settings → Advanced**
- "Enable Automatic HTTPS" should be ON
- "HTTP to HTTPS Redirect" should be ON

### 5. Compare with Elite Squad

In Coolify, compare these settings between elite-squad and super-invite:

1. **Domain Settings**: Both should have SSL enabled
2. **Port Mapping**: Check if ports are correctly exposed
3. **Proxy Labels**: Should be automatically configured by Coolify
4. **Network**: Both apps should be on the same network if they need to communicate

### 6. SSL Certificate Status

Check SSL certificate status:
- Go to your app in Coolify
- Look for "SSL Certificate" section
- Status should be "Active" or "Valid"
- If "Pending" or "Failed", try regenerating the certificate

### 7. Traefik Dashboard (Optional)

If you have access to Traefik dashboard:
- Check if your app's routes are properly configured
- Verify SSL/TLS configuration
- Check middleware settings

### Common Issues & Solutions

#### Issue: "Certificate generation failed"
**Solution:**
- Ensure your domain DNS is pointing to the Coolify server
- Wait for DNS propagation (can take up to 48 hours)
- Try using Cloudflare DNS (faster propagation)

#### Issue: "Mixed content warnings"
**Solution:**
- Ensure `NEXT_PUBLIC_API_URL` uses `https://`
- Check that all API calls use the HTTPS URL
- Verify `BETTER_AUTH_URL` is HTTPS

#### Issue: "CORS errors after enabling HTTPS"
**Solution:**
- Update `CORS_ORIGINS` to use `https://` instead of `http://`
- Ensure both frontend and backend URLs match
- Check cookie settings (sameSite, secure)

#### Issue: "Session not persisting"
**Solution:**
- Verify `BETTER_AUTH_URL` matches `NEXT_PUBLIC_API_URL`
- Check that cookies are being set (browser DevTools → Application → Cookies)
- Ensure `secure: true` in cookie settings (production)
- Verify `COOKIE_DOMAIN` is correct or empty

### Quick Checklist

- [ ] Domain configured in Coolify
- [ ] SSL certificate generated and active
- [ ] Force HTTPS enabled
- [ ] Port 30011 exposed for web app
- [ ] Port 3000 exposed for server app
- [ ] `NEXT_PUBLIC_API_URL` uses HTTPS
- [ ] `BETTER_AUTH_URL` uses HTTPS
- [ ] `CORS_ORIGINS` uses HTTPS
- [ ] Environment variables match between web and server
- [ ] DNS pointing to Coolify server
- [ ] Both apps deployed and running

### Testing HTTPS

After configuration:

1. Visit your app URL (should auto-redirect to HTTPS)
2. Check browser address bar for padlock icon
3. Open DevTools → Network → Check if all requests use HTTPS
4. Test login/logout to verify session persistence
5. Check cookies in DevTools → Application → Cookies

### Debugging

If HTTPS still doesn't work:

1. Check Coolify logs:
   - Application logs
   - Build logs
   - Deployment logs

2. Check Traefik logs (if accessible)

3. Test with curl:
   ```bash
   curl -I https://your-app-domain.com
   ```

4. Check SSL certificate:
   ```bash
   openssl s_client -connect your-app-domain.com:443
   ```

### Need Help?

If you're still having issues:
1. Compare all settings with elite-squad in Coolify
2. Check if elite-squad has any custom Traefik labels
3. Verify both apps are using the same Coolify version
4. Check Coolify documentation for SSL/HTTPS setup
