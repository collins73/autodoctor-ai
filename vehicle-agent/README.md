# 🩺 AutoDoctor AI

An autonomous vehicle maintenance agent that translates OBD-II fault codes into plain English, recommends repairs, and manages vehicle service history — all in one platform.

---

## 🚀 Features

- **Diagnose** — Enter any OBD-II fault code and get a plain English explanation, severity rating, estimated repair cost, and recommended action
- **Documents** — Upload and process vehicle maintenance documents
- **Records** — Track full diagnostic and service history
- **Vehicles** — Manage your fleet of vehicles with full profiles

---

## 🛠 Tech Stack

- **Frontend:** HTML, Tailwind CSS, Vanilla JS
- **Backend:** Base44 (managed backend — entities, storage, automations)
- **Database Entities:**
  - `Vehicle` — owner info, make/model/year, VIN, mileage
  - `DiagnosticReport` — fault codes, severity, cost estimates, recommendations
  - `ServiceRequest` — shop info, appointment scheduling, status tracking

---

## 📦 Project Structure

```
autodoctor-ai/
├── index.html        # Main app — all modules in one file
└── README.md         # You are here
```

---

## ⚙️ Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/collins73/autodoctor-ai.git
   ```

2. Open `index.html` in your browser for local preview, or deploy via [Base44](https://app.base44.com).

3. Live app:
   ```
   https://app.base44.com/apps/69b31cad519658696367ff11/editor/preview/Diagnose
   ```

---

## 🗺 Roadmap

- [ ] OBD-II API integration for real-time fault code lookup
- [ ] AI-powered repair cost estimation
- [ ] Shop finder & appointment booking
- [ ] Mobile app (iOS/Android)
- [ ] Multi-user / fleet management support
- [ ] Production deployment

---

## 🔒 Status

> **Private — Pre-production MVP**
> Currently in active development and testing. Not yet open for public use.

---

## 👤 Author

Built by **D** with [Rebel AI](https://base44.com) ⚡

---

*Last updated: March 14, 2026*
