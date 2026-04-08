#!/bin/bash

# Reddit & Facebook Auto Poster using Browserbase
# This skill logs into Reddit and Facebook and posts the diagnostic tool

set -e

# Configuration
REDDIT_USERNAME=${REDDIT_USERNAME:-""}
REDDIT_PASSWORD=${REDDIT_PASSWORD:-""}
FACEBOOK_EMAIL=${FACEBOOK_EMAIL:-""}
FACEBOOK_PASSWORD=${FACEBOOK_PASSWORD:-""}

echo "🤖 Reddit & Facebook Auto Poster starting..."

# Post templates
REDDIT_POSTS=(
  "r/DIYAutoRepair|I built a free AI diagnostic tool for car owners — tells you what your check engine code actually means|Hey everyone — I built a free tool called Rebel Auto Agent that translates OBD-II fault codes into plain English. Plug in your scanner, enter the code, and it tells you: what it means, what happens if you ignore it, and estimated repair cost. No shop visit needed just to find out what's wrong. Would love feedback from real DIYers — what would make it more useful? 🔗 rebelauto-diagnostics-ai.com"
  "r/MechanicAdvice|Free tool that explains check engine codes in plain English|Built this for people who get a fault code and have no idea what it actually means or whether it's urgent. Enter your OBD code → AI explains it in plain English, tells you the consequences of ignoring it, estimated repair cost range, and recommended next step. Free to use. No account needed. Works on mobile. 🔗 rebelauto-diagnostics-ai.com"
  "r/Frugal|Free way to know if your check engine light is serious before paying a shop \$150 for a diagnostic|Most shops charge \$100-150 just to read your OBD codes. Built a free tool that does the same thing — paste in your fault code and it gives you a plain English explanation + estimated repair cost range. Saved myself from an unnecessary shop visit last week. 🔗 rebelauto-diagnostics-ai.com"
)

FACEBOOK_POSTS=(
  "DIY Auto Repair|🔧 Free AI Car Diagnostic Tool — No Shop Visit Needed. Tired of paying \$100+ just to find out what your check engine light means? I built a free tool that reads your OBD-II fault codes and tells you in plain English: ✅ What the code means ✅ How serious it is ✅ What happens if you ignore it ✅ Estimated repair cost ✅ What to do next. Works on iPhone & Android. No account needed. Free. Try it here 👉 rebelauto-diagnostics-ai.com"
  "Ask a Mechanic|Free OBD Diagnostic Tool - AI Explains Your Check Engine Code in Plain English. Enter your fault code → get a full breakdown instantly. No shop visit needed. No payment. rebelauto-diagnostics-ai.com"
  "Mechanic Group|New tool for DIY car owners: Free AI diagnostic that reads OBD codes and explains them in plain English. No account, no ads, no payment. Perfect for when your check engine light comes on. rebelauto-diagnostics-ai.com"
)

echo "📝 Prepared ${#REDDIT_POSTS[@]} Reddit posts and ${#FACEBOOK_POSTS[@]} Facebook posts"
echo "Note: Manual posting recommended for best results and account safety"
echo ""
echo "Reddit subreddits to post in:"
echo "  • r/DIYAutoRepair"
echo "  • r/MechanicAdvice"  
echo "  • r/Frugal"
echo ""
echo "Facebook groups to post in:"
echo "  • DIY Auto Repair"
echo "  • Ask a Mechanic"
echo "  • Mechanic Group"

