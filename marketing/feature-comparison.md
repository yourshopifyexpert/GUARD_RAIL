# AI Supervisor - Feature Comparison

## Free vs Premium Tiers

### Quick Comparison Table

| Feature | Free | Premium |
|---------|------|---------|
| **Monitoring** |
| Real-time AI change monitoring | ✅ | ✅ |
| File modification tracking | ✅ | ✅ |
| Code suggestion monitoring | ✅ | ✅ |
| **Deviation Detection** |
| Basic pattern matching | ✅ | ✅ |
| Statistical analysis | ✅ | ✅ |
| AI-powered semantic analysis | ❌ | ✅ |
| Intent analysis | ❌ | ✅ |
| Cross-file impact detection | ❌ | ✅ |
| Side-effect detection | ❌ | ✅ |
| **Project Management** |
| Number of projects | 1 | Unlimited |
| Project switching | Manual | Automatic |
| Workspace sync | ❌ | ✅ |
| **Memory & History** |
| History retention | 30 days | Unlimited |
| Storage location | Local only | Local + Cloud |
| Cloud backup | ❌ | ✅ |
| Cloud sync across devices | ❌ | ✅ |
| Export history | JSON only | JSON, CSV, PDF |
| Time-travel debugging | ❌ | ✅ |
| **Guard Rails** |
| Protected files | ❌ | ✅ |
| Protected directories | ❌ | ✅ |
| Custom rules | ❌ | ✅ |
| Pattern matching rules | ❌ | ✅ |
| Conditional rules | ❌ | ✅ |
| Rule templates | ❌ | ✅ |
| Team rule sharing | ❌ | ✅ |
| **Rollback** |
| Manual rollback | ✅ | ✅ |
| One-click restore | ✅ | ✅ |
| Automatic rollback | ❌ | ✅ |
| Rollback to timestamp | ❌ | ✅ |
| Batch rollback | ❌ | ✅ |
| **Analytics** |
| Basic usage stats | ✅ | ✅ |
| Advanced analytics dashboard | ❌ | ✅ |
| Code quality trends | ❌ | ✅ |
| AI usage patterns | ❌ | ✅ |
| Deviation insights | ❌ | ✅ |
| Export analytics | ❌ | ✅ |
| **Collaboration** |
| Solo developer | ✅ | ✅ |
| Team features | ❌ | ✅ |
| Shared guard rails | ❌ | ✅ |
| Team analytics | ❌ | ✅ |
| Usage reports | ❌ | ✅ |
| **AI Assistant Support** |
| GitHub Copilot | ✅ | ✅ |
| Cursor | ✅ | ✅ |
| Amazon CodeWhisperer | ✅ | ✅ |
| Tabnine | ✅ | ✅ |
| Codeium | ✅ | ✅ |
| Other VS Code AI tools | ✅ | ✅ |
| **Support** |
| Community forums | ✅ | ✅ |
| Email support | ✅ | ✅ |
| Response time | 48 hours | 4 hours |
| Priority support | ❌ | ✅ |
| Live chat | ❌ | ✅ |
| Video calls | ❌ | ✅ (on request) |
| **License** |
| Number of devices | 1 | 3 |
| License transfer | ❌ | ✅ |
| Offline grace period | N/A | 7 days |
| **Price** |
| Cost | $0 | $12/month or $100/year |

## Detailed Feature Breakdown

### 1. Monitoring Capabilities

#### Free Tier
- **Real-time monitoring** of all AI-generated changes
- **File tracking** for creates, modifies, and deletes
- **Code suggestions** monitoring in editor
- **Basic notifications** for all changes
- **Single project** monitoring at a time

#### Premium Tier
- **Everything in Free**, plus:
- **Multi-project** monitoring with auto-switching
- **Advanced notifications** with customizable rules
- **Performance metrics** for AI usage
- **Detailed change logs** with full context

**Use Case:**
- Free: Perfect for personal projects or learning
- Premium: Essential for developers working on multiple projects or teams

---

### 2. Deviation Detection

#### Free Tier
- **Pattern matching** against common code patterns
- **Statistical analysis** of code changes
- **Basic deviation scoring** (0-100 scale)
- **Simple alerts** for high-deviation changes

#### Premium Tier
- **Everything in Free**, plus:
- **AI-powered semantic analysis** understanding code meaning
- **Intent detection** (does the code do what it claims?)
- **Cross-file impact analysis** checking dependencies
- **Side-effect detection** for unintended consequences
- **Historical learning** improving accuracy over time
- **Context-aware scoring** based on your project

**Example:**
```javascript
// Free tier catches:
const user = fetchUser(); // Unknown function 'fetchUser'

// Premium also catches:
const user = await getUser(); // Missing error handling that's standard in this project
```

---

### 3. Guard Rails & Rules

#### Free Tier
- **No custom guard rails** available
- Manual approval for all changes

#### Premium Tier
- **Unlimited custom rules** with JavaScript expressions
- **Protected files** (e.g., package.json, .env)
- **Protected directories** (e.g., /config, /core)
- **Pattern-based rules** using regex
- **Conditional rules** with complex logic
- **Rule templates** for common scenarios
- **Team rule sharing** via config files

**Example Rules:**
```json
{
  "guardRails": {
    "protectedFiles": ["package.json", "tsconfig.json"],
    "customRules": [
      {
        "name": "No console.log in production",
        "pattern": "console\\.log",
        "files": ["src/**/*.ts"],
        "severity": "error"
      },
      {
        "name": "Require tests for new features",
        "condition": "newFile && !file.includes('.test.')",
        "severity": "warning"
      }
    ]
  }
}
```

---

### 4. Memory & History

#### Free Tier
- **30-day history** stored locally
- **Local storage only** (~100MB on disk)
- **Basic search** by file or date
- **JSON export** for backup

#### Premium Tier
- **Unlimited history** in the cloud
- **Cloud sync** across all your devices
- **Advanced search** with filters
- **Export formats:** JSON, CSV, PDF
- **Time-travel debugging** (view project at any point)
- **Automatic backups** with versioning

**Storage Comparison:**
- Free: Up to 1,000 changes (~100MB)
- Premium: Unlimited (~1GB cloud storage included)

---

### 5. Rollback Capabilities

#### Free Tier
- **Manual rollback** one change at a time
- **One-click restore** to previous version
- **Confirmation prompts** before rollback

#### Premium Tier
- **Everything in Free**, plus:
- **Automatic rollback** on critical violations
- **Rollback to timestamp** (restore to specific point in time)
- **Batch rollback** (undo multiple changes)
- **Smart rollback** (only undo problematic parts)
- **Rollback preview** before applying

---

### 6. Analytics & Insights

#### Free Tier
- **Basic stats:** Total changes, acceptance rate
- **Simple dashboard** showing last 7 days
- **Daily summaries** via email (opt-in)

#### Premium Tier
- **Everything in Free**, plus:
- **Advanced dashboard** with customizable views
- **Code quality trends** over time
- **AI usage patterns** (when, where, what)
- **Deviation insights** (common patterns, improvements)
- **Team analytics** (if using team features)
- **Export reports** as PDF or CSV
- **Custom date ranges** for analysis

**Metrics Tracked:**
- AI suggestions per day/week/month
- Acceptance vs rejection rate
- Average deviation scores
- Top files modified
- Time saved estimates
- Hallucinations prevented
- Quality score trends

---

### 7. Team Collaboration (Premium Only)

**Not available in Free tier**

**Premium Tier includes:**
- **Shared guard rails** via config files
- **Team analytics** dashboard
- **Usage reports** for managers
- **Centralized settings** management
- **Team rule libraries** for best practices
- **Audit logs** for compliance

**Ideal for:**
- Development teams (5+ developers)
- Open source projects
- Agencies managing multiple clients
- Companies with coding standards

---

### 8. Support

#### Free Tier
- **Community forums** on GitHub Discussions
- **Email support** (support@ai-supervisor.dev)
- **Response time:** 48 hours
- **Documentation** and guides
- **Self-service** knowledge base

#### Premium Tier
- **Everything in Free**, plus:
- **Priority support** (4-hour response time)
- **Live chat** support during business hours
- **Video calls** for complex issues (on request)
- **Dedicated support engineer** for teams
- **Feature request priority**

---

## Pricing

### Free Tier
- **$0 forever**
- No credit card required
- All core monitoring features
- Perfect for:
  - Personal projects
  - Learning and experimentation
  - Open source contributors
  - Students

### Premium Tier
- **$12/month** (billed monthly)
- **$100/year** (save 30% = $20/year)
- 14-day free trial (no credit card)
- 30-day money-back guarantee
- Use on up to 3 devices
- Cancel anytime
- Perfect for:
  - Professional developers
  - Teams and companies
  - Production codebases
  - Multi-project workflows

### Special Pricing

**Students & Educators:** 50% off Premium
- Must have valid .edu email
- $6/month or $50/year

**Open Source Contributors:** Free Premium
- Active contributors to public projects
- Must demonstrate contribution history
- Annual verification required

**Teams (5+ licenses):** Volume discounts
- 5-10 licenses: 15% off
- 11-25 licenses: 25% off
- 26+ licenses: 35% off
- Contact: team@ai-supervisor.dev

---

## Migration Path

### From Free to Premium

**What happens when you upgrade:**
1. ✅ All local history is preserved
2. ✅ Settings and preferences carry over
3. ✅ No interruption to workflow
4. ✅ Premium features activate immediately
5. ✅ Local data synced to cloud automatically

**What you gain immediately:**
- AI-powered detection starts analyzing your project
- Cloud backup begins
- Custom guard rails unlock
- Analytics dashboard populates with historical data
- Automatic rollback activates

### From Premium to Free (Downgrade)

**What happens when you cancel:**
1. 🔒 Premium features lock after billing period ends
2. 📥 Cloud data available for download (30 days)
3. 🔄 Revert to 30-day local history
4. ⚙️ Custom guard rails become read-only
5. 📊 Analytics become view-only

**No data loss:**
- All local data remains intact
- Export your cloud data before downgrade
- Reactivate premium anytime to restore

---

## Choosing the Right Tier

### Choose Free if you:
- ✅ Work on 1-2 personal projects
- ✅ Want basic AI monitoring
- ✅ Don't need custom rules
- ✅ Prefer local-only storage
- ✅ Have basic support needs

### Choose Premium if you:
- ✅ Work on multiple projects
- ✅ Need advanced deviation detection
- ✅ Want custom guard rails
- ✅ Require cloud sync
- ✅ Value automatic rollback
- ✅ Need analytics insights
- ✅ Work in a team
- ✅ Build production applications

### Upgrade Later?
Start with Free and upgrade when you:
- Need to monitor multiple projects
- Want AI-powered analysis
- Require team collaboration
- Hit the 30-day history limit
- Need priority support

**No pressure - Free tier is genuinely useful!**

---

## ROI Calculation (Premium)

**Cost:** $12/month ($144/year)

**Time saved per month** (conservative estimate):
- 2 hours debugging AI mistakes: $100-200
- 1 hour from auto-rollback: $50-100
- 1 hour from analytics insights: $50-100

**Total value:** $200-400/month
**ROI:** 15x - 30x

**One prevented production bug** can pay for a year of Premium.

---

## FAQs

**Q: Can I try Premium before paying?**
A: Yes! 14-day free trial, no credit card required.

**Q: What if I don't like Premium?**
A: 30-day money-back guarantee, no questions asked.

**Q: Can I switch between monthly and annual?**
A: Yes, anytime. We'll pro-rate the difference.

**Q: Do I lose my data if I downgrade?**
A: No, local data stays. Cloud data downloadable for 30 days.

**Q: Can I share my Premium license?**
A: No, but team licenses available with discounts.

**Q: Is there a lifetime license?**
A: Not currently, but we may offer one for early adopters. Join the waitlist!

---

## Summary

| | Free | Premium |
|---|---|---|
| **Best For** | Personal projects | Professional work |
| **Price** | $0 | $12/month |
| **Projects** | 1 | Unlimited |
| **Deviation Detection** | Basic | AI-Powered |
| **History** | 30 days | Unlimited |
| **Guard Rails** | None | Custom |
| **Rollback** | Manual | Automatic |
| **Support** | Community | Priority |

**Start with Free, upgrade when you need more power.**

[Install Free Now](marketplace-link) | [Start Premium Trial](checkout-link)
