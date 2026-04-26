# 🚗 Rebel Auto Agent — AI-Powered Vehicle Diagnostics

**Rebel Auto Agent** is an intelligent, autonomous vehicle diagnostic platform that helps car owners understand their vehicle's health, decode fault codes, and connect with trusted repair shops — all without needing a dealership.

> ⚡ Powered by AI. Built for real drivers.

🔗 **Live App:** [rebelauto-diagnostics-ai.com](https://rebelauto-diagnostics-ai.com)

---

## 🚀 Features

### 🔍 AI Diagnostic Engine
- Decode **OBD-II fault codes** (P, B, C, U codes) instantly
- Plain-English explanations — no mechanic jargon
- Severity ratings: Low, Moderate, High, Critical
- Estimated repair cost ranges
- Consequences of ignoring the issue
- Recommended next actions

### 📡 Multiple Scan Modes
- **Bluetooth OBD Scan** — Connect a Bluetooth OBD-II adapter (Android & Desktop)
- **WiFi OBD Scan** — Connect via WiFi adapter (iOS & Android via 192.168.0.10:35000)
- **Symptom Checker** — Describe symptoms and let AI diagnose without hardware

### 🏪 Shop Finder
- Locate nearby repair shops based on your location and fault codes
- View shop name, address, phone, and distance
- Request appointments directly through the app

### 📋 Diagnostic History
- All past diagnostics stored and accessible anytime
- Track vehicle health over time
- Export reports for your mechanic

### 🎙️ Voice Mode *(Pro)*
- Speak your fault codes — Voice-to-Text input
- AI reads back the full diagnosis — Text-to-Speech output
- Hands-free diagnostics while in the garage

### 🔒 Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| Free Trial | $0 | 3 free diagnostics |
| Pro | $19.99/mo | Unlimited diagnostics, Voice Mode, Shop Finder, PDF export, priority AI |

---

## 🖥️ How It Works

1. **Add Your Vehicle** — Enter year, make, model, mileage, and VIN
2. **Connect or Enter Code** — Use Bluetooth/WiFi OBD adapter or type in a fault code
3. **Get Your Diagnosis** — AI analyzes the code and explains it in plain English
4. **Find a Shop** — Get matched with nearby repair shops and book an appointment

---

## 🧰 Tech Stack

- **Frontend:** React, Tailwind CSS, Framer Motion, shadcn/ui
- **Backend:** Base44 serverless functions (Deno runtime)
- **AI Engine:** LLM-based fault code interpretation and symptom analysis
- **Database:** Base44 managed entity store
- **Payments:** Stripe (live subscriptions at $19.99/mo)
- **Hardware Support:** ELM327 protocol (Bluetooth & WiFi OBD-II adapters)

---

## 📁 Project Structure

```
pages/
  Landing.jsx         — Public landing page
  Dashboard.jsx       — Vehicle health overview
  Diagnose.jsx        — OBD scan + fault code entry + symptom checker
  Feedback.jsx        — User feedback form
  FeedbackTracker.jsx — Admin feedback dashboard

functions/
  interpretFaultCode  — AI fault code analysis engine
  findNearbyShops     — Location-based shop discovery
  checkTrialStatus    — Subscription and trial gating
  createCheckout      — Stripe checkout session creator
  stripeWebhook       — Stripe subscription event handler
  submitFeedback      — Feedback submission handler

entities/
  Vehicle             — Vehicle profiles and metadata
  DiagnosticReport    — AI-generated diagnostic results
  ServiceRequest      — Appointment and shop booking records
  UserFeedback        — User ratings and feedback
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe live secret key for payment processing |
| `GITHUB_TOKEN` | GitHub token for repo access and GitHub Pages deployment |

---

## 🛒 Recommended OBD-II Adapters

| Adapter | Type | Compatibility |
|---------|------|---------------|
| OBDLink MX+ | Bluetooth | Android, Desktop |
| Veepeak OBDCheck BLE+ | Bluetooth | Android, Desktop |
| Veepeak WiFi OBD2 | WiFi | iOS, Android |

> 📎 Amazon affiliate links available in the app — tag: `rebelauto20-20`

---

## 📬 Support & Feedback

Have a question, feature request, or bug report? Open an issue or reach out via the in-app feedback form.

---

## 📄 License

MIT License — feel free to fork and build on top of this project.

---

*Built with ⚡ by [Rebel Agents AI](https://rebelagents.ai) — Autonomous AI agents for real-world problems.*
