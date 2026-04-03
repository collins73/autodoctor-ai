# ⚡ Rebel Auto Agent

An autonomous AI-powered vehicle diagnostic platform. Translates OBD-II fault codes into plain English, estimates repair costs, finds nearby shops, and tracks full service history — built for real drivers on any device.

> **Live App:** [rebelauto-diagnostics-ai.com](https://rebelauto-diagnostics-ai.com)

---

## 🚀 Features

- **Diagnose** — Enter an OBD-II code, connect a Bluetooth/WiFi adapter, or describe symptoms — get a plain English breakdown, severity rating, cost estimate, and recommended action
- **Bluetooth OBD Scan** — Auto-read fault codes via ELM327 Bluetooth adapter (Android / Chrome)
- **WiFi OBD Scan** — Read fault codes via WiFi ELM327 adapter — works on iPhone and all devices
- **Symptom Checker** — No scanner? Describe what's wrong and get an AI diagnosis
- **AI Chat** — Ask follow-up questions about any diagnostic result
- **Shop Finder** — Locate nearby repair shops based on user location
- **PDF Export** — Export diagnostic reports as downloadable files
- **Share** — Native share or clipboard copy of any diagnosis
- **Dashboard** — Vehicle fleet overview, diagnostic history, service request tracking
- **Feedback Tracker** — Capture and review user feedback for product iteration

---

## 🛠 Tech Stack

- **Frontend:** React (JSX), Base44 mini-app framework
- **Backend:** Base44 managed backend — entities, automations, serverless functions
- **AI:** OpenAI GPT-4 via `interpretFaultCode` backend function
- **Payments:** Stripe (checkout, webhooks, trial management)
- **Custom Domain:** rebelauto-diagnostics-ai.com

---

## 📦 Project Structure

```
rebel-auto-agent/
├── pages/
│   ├── Landing.jsx           # Marketing landing page
│   ├── Diagnose.jsx          # Core diagnostic flow (iOS + Android compatible)
│   ├── Dashboard.jsx         # Fleet + history overview
│   ├── Feedback.jsx          # User feedback form
│   └── FeedbackTracker.jsx   # Admin feedback review
│
├── functions/
│   ├── interpretFaultCode.ts # AI fault code + symptom interpretation
│   ├── findNearbyShops.ts    # Google Places shop finder
│   ├── createCheckout.ts     # Stripe checkout session
│   ├── stripeWebhook.ts      # Stripe payment webhook handler
│   ├── checkTrialStatus.ts   # Trial / subscription gate
│   └── submitFeedback.ts     # Feedback submission endpoint
│
├── index.html                # Legacy standalone preview
└── README.md                 # You are here
```

---

## 📱 Device Compatibility

| Feature | iPhone (Safari) | Android (Chrome) | Desktop |
|---|---|---|---|
| WiFi OBD Scan | ✅ | ✅ | ✅ |
| Bluetooth OBD Scan | ❌ (Apple blocks) | ✅ | ✅ |
| Manual Code Entry | ✅ | ✅ | ✅ |
| Symptom Checker | ✅ | ✅ | ✅ |
| PDF Export | ✅ | ✅ | ✅ |
| Share | ✅ | ✅ | ✅ |

---

## 🗄 Database Entities

| Entity | Purpose |
|---|---|
| `Vehicle` | Owner info, make/model/year, VIN, mileage |
| `DiagnosticReport` | Fault codes, severity, cost estimates, AI recommendations |
| `ServiceRequest` | Shop info, appointment scheduling, status tracking |
| `UserFeedback` | Beta user feedback, ratings, contact info |

---

## 💳 Subscription Tiers (Phase 2)

| Tier | Price | Features |
|---|---|---|
| Free | $0 | 3 diagnostics trial |
| Basic | $9.99/mo | Unlimited diagnostics + shop finder |
| Pro | $19.99/mo | Everything + Voice Mode, PDF export, priority AI |

---

## 🗺 Roadmap

### ✅ Completed (MVP)
- [x] OBD-II fault code AI interpretation
- [x] Symptom-based diagnosis (no scanner needed)
- [x] Bluetooth ELM327 adapter integration (Android)
- [x] WiFi ELM327 adapter integration (iOS + all devices)
- [x] Shop finder by location
- [x] PDF export + native share
- [x] Stripe payments + trial gating
- [x] Amazon Associates affiliate monetization
- [x] Custom domain deployment
- [x] User feedback collection

### 🔜 Phase 2
- [ ] Voice input / voice readout (Pro tier)
- [ ] Live OBD sensor dashboard (RPM, coolant, O2, battery)
- [ ] VIN decoder auto-fill
- [ ] Push notifications for critical codes

### 🔮 Phase 3
- [ ] React Native mobile app (iOS + Android)
- [ ] BLE direct connection on native app
- [ ] Fleet management for multi-vehicle users
- [ ] Mechanic marketplace / booking

---

## ⚙️ Local Development

```bash
git clone https://github.com/collins73/autodoctor-ai.git
cd autodoctor-ai

# Preview pages locally (Base44 framework required for full functionality)
# Deploy via Base44 app builder: https://app.base44.com
```

Backend functions are deployed to:
```
https://rebel-ai-36e8d1bc.base44.app/functions/<function_name>
```

---

## 🔒 Status

> **Private — Active Development**
> MVP live at [rebelauto-diagnostics-ai.com](https://rebelauto-diagnostics-ai.com). Collecting beta feedback. Phase 2 in planning.

---

## 👤 Author

Built by **D** with [Rebel AI](https://base44.com) ⚡

---

*Last updated: April 3, 2026*
