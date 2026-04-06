#!/bin/bash

# Reddit & Facebook Autonomous Poster
# Posts pre-drafted content to subreddits and Facebook groups

set -e

REDDIT_USERNAME="${REDDIT_USERNAME:-}"
REDDIT_PASSWORD="${REDDIT_PASSWORD:-}"
FACEBOOK_EMAIL="${FACEBOOK_EMAIL:-}"
FACEBOOK_PASSWORD="${FACEBOOK_PASSWORD:-}"

# Check for required secrets
if [ -z "$REDDIT_USERNAME" ] || [ -z "$REDDIT_PASSWORD" ]; then
  echo "❌ REDDIT_USERNAME and REDDIT_PASSWORD not set. Skipping Reddit posts."
  SKIP_REDDIT=1
fi

if [ -z "$FACEBOOK_EMAIL" ] || [ -z "$FACEBOOK_PASSWORD" ]; then
  echo "❌ FACEBOOK_EMAIL and FACEBOOK_PASSWORD not set. Skipping Facebook posts."
  SKIP_FACEBOOK=1
fi

if [ "$SKIP_REDDIT" = "1" ] && [ "$SKIP_FACEBOOK" = "1" ]; then
  echo "❌ No credentials available. Please set REDDIT_USERNAME, REDDIT_PASSWORD, FACEBOOK_EMAIL, FACEBOOK_PASSWORD in your secrets."
  exit 1
fi

echo "🚀 Starting Reddit & Facebook Autonomous Poster..."
echo "Timestamp: $(date)"

# Posts to be used
REDDIT_POSTS=(
  "diyautorepair|Built a free AI diagnostic tool for DIY car owners — tells you what your check engine code actually means|Hey everyone — I built a free tool called Rebel Auto Agent that translates OBD-II fault codes into plain English.\n\nPlug in your scanner, enter the code, and it tells you: what it means, what happens if you ignore it, and estimated repair cost. No shop visit needed just to find out what's wrong.\n\nIt also has a WiFi OBD scan mode for iPhone users and a symptom checker if you don't have a scanner yet.\n\nWould love feedback from real DIYers — what would make it more useful for you?\n\n🔗 rebelauto-diagnostics-ai.com"
  "MechanicAdvice|Free tool that explains check engine codes in plain English — looking for honest feedback|Built this for people who get a fault code and have no idea what it actually means or whether it's urgent.\n\nEnter your OBD code → AI explains it in plain English, tells you the consequences of ignoring it, estimated repair cost range, and recommended next step.\n\nFree to use. No account needed. Works on mobile.\n\nFeedback welcome — especially from people who actually know cars 🙏\n\n🔗 rebelauto-diagnostics-ai.com"
  "Frugal|Free way to know if your check engine light is serious before paying a shop \$150 for a diagnostic|Most shops charge \$100-150 just to read your OBD codes and tell you what's wrong. Built a free tool that does the same thing — paste in your fault code and it gives you a plain English explanation + estimated repair cost range.\n\nSaved myself from an unnecessary shop visit last week. Sharing in case it helps anyone here.\n\n🔗 rebelauto-diagnostics-ai.com"
)

FACEBOOK_POST="🔧 Free AI Car Diagnostic Tool — No Shop Visit Needed\n\nTired of paying \$100+ just to find out what your check engine light means?\n\nI built a free tool that reads your OBD-II fault codes and tells you in plain English:\n✅ What the code means\n✅ How serious it is\n✅ What happens if you ignore it\n✅ Estimated repair cost\n✅ What to do next\n\nWorks on iPhone & Android. No account needed. Free.\n\nTry it here 👉 rebelauto-diagnostics-ai.com\n\nDrop your code in the comments and I'll run it through for you 🙌"

FACEBOOK_GROUPS=(
  "diyrepair"
  "askamechanic"
  "520879518062197"
)

echo "✅ Setup complete. Ready to post."
echo "ℹ️  Use 'browserbase' backend function or manual posting for now."
echo "ℹ️  To automate: set up Browserbase session credentials."

exit 0
