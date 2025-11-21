# AI Supervisor Website

Official website for AI Supervisor - Prevent AI Hallucinations in Your Code

## Overview

This is a Next.js 14 website featuring:
- Landing page with hero, features, and social proof
- Pricing page with free vs premium comparison
- Comprehensive documentation site
- Blog for updates and announcements
- SEO optimized and mobile responsive

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Analytics:** Vercel Analytics
- **Deployment:** Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the website.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
website/
├── app/                      # Next.js 14 app directory
│   ├── page.tsx             # Landing page
│   ├── pricing/             # Pricing page
│   ├── docs/                # Documentation site
│   │   ├── getting-started/ # Installation guide
│   │   ├── features/        # Feature documentation
│   │   ├── api/             # API reference
│   │   └── faq/             # FAQ
│   ├── blog/                # Blog
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── Header.tsx           # Site header
│   └── Footer.tsx           # Site footer
├── public/                  # Static assets
│   ├── images/              # Images
│   └── screenshots/         # Product screenshots
└── package.json
```

## Adding Content

### Screenshots

Replace placeholder content with actual screenshots:
- `/public/screenshots/hero-screenshot.png` - Main hero screenshot
- `/public/images/og-image.png` - Open Graph image (1200x630)
- `/public/images/twitter-card.png` - Twitter card image (1200x675)

### Blog Posts

Add new blog posts in `/app/blog/` directory. The blog structure is set up to be extended with markdown files or a headless CMS like Contentful or Sanity.

## SEO Optimization

The site includes:
- Meta tags for all pages
- Open Graph tags for social sharing
- Twitter Card tags
- Semantic HTML structure
- Fast loading times (<2s target)
- Mobile responsive design

### Update SEO Tags

Edit `/app/layout.tsx` to update:
- Google verification code
- Default meta description
- OG images
- Twitter handles

## Performance

Target metrics:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: > 90

### Optimization Tips

1. Use Next.js Image component for all images
2. Minimize JavaScript bundle size
3. Enable compression in next.config.js
4. Use font optimization
5. Implement lazy loading for below-fold content

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project to Vercel
3. Deploy automatically

### Other Platforms

Build the static site and deploy to any hosting provider:

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

## License

Copyright (c) 2024 AI Supervisor. All rights reserved.
