# 🚀 Deploying "The Signal" to Vercel

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Push your code to GitHub/GitLab
3. **Node.js**: Version 18 or higher

## Quick Deployment

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project directory**:
   ```bash
   cd "C:\Project\Personal\The Signal"
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Set project name: `the-signal`
   - Set directory: `./` (current directory)
   - Override settings: `No`

5. **Production deployment**:
   ```bash
   vercel --prod
   ```

### Method 2: Vercel Dashboard

1. **Go to Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)

2. **Import Project**:
   - Click "Import Project"
   - Connect your Git repository
   - Vercel will auto-detect the project settings

3. **Configure Build Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Deploy**: Click "Deploy"

## Environment Variables (Optional)

If you want to add analytics or other features later:

```bash
# Add environment variables in Vercel dashboard
VERCEL_ENV=production
NODE_ENV=production
```

## Custom Domain (Optional)

1. **Go to Project Settings** → **Domains**
2. **Add custom domain** (e.g., `the-signal-game.com`)
3. **Configure DNS** as instructed

## Troubleshooting

### Common Issues

**1. Build Fails**
```bash
# Clear cache and rebuild
vercel --force
```

**2. WebGL Not Working**
- Vercel automatically handles WebGL
- Make sure you're using HTTPS (required for Web Audio API)

**3. Assets Not Loading**
- Check that all paths are relative
- Ensure assets are in the `public/` directory or bundled

**4. Large Bundle Size**
- Enable code splitting (already configured in Vite)
- Use dynamic imports for large modules

### Performance Optimization

1. **Enable Compression**:
   ```javascript
   // vercel.json already includes headers for CORS
   ```

2. **CDN Optimization**:
   - Vercel automatically serves assets via CDN
   - Static assets are cached globally

3. **Build Optimization**:
   ```bash
   # Enable production optimizations
   npm run build
   ```

## Testing Deployment

### Local Testing
```bash
# Test production build locally
npm run build
npm run preview
```

### Live Testing
1. **Open deployed URL**
2. **Check browser console** for errors
3. **Test all game features**:
   - ✅ Menu navigation
   - ✅ Game loading
   - ✅ FPS controls
   - ✅ Save/load functionality
   - ✅ Audio playback
   - ✅ WebGL rendering

## Maintenance

### Updating the Game
```bash
# Push changes to your git repository
git add .
git commit -m "Update game features"
git push origin main

# Vercel will automatically redeploy
```

### Monitoring
- **Vercel Analytics**: Built-in analytics dashboard
- **Error Tracking**: Check Vercel function logs
- **Performance**: Monitor Core Web Vitals

## Backup Strategy

Since the game uses localStorage for saves:
- **User saves are stored locally** in their browser
- **No server-side save data** to backup
- **Game can be updated** without affecting user progress

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all files are committed to git
3. Ensure Node.js version compatibility
4. Test locally with `npm run build && npm run preview`

## Deployment Checklist

- ✅ **Git repository** pushed to GitHub/GitLab
- ✅ **vercel.json** configured correctly
- ✅ **Build process** working locally
- ✅ **All assets** properly referenced
- ✅ **HTTPS enabled** (required for Web Audio API)
- ✅ **CORS headers** configured
- ✅ **WebGL compatibility** verified

---

🎮 **Your horror FPS game is now ready for the world!** 🌐

**Live URL**: `https://your-project-name.vercel.app`

**Share your game**: `https://your-project-name.vercel.app`

**Enjoy the terror!** 👻🎯
