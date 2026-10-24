# AMATE 38 & LA CUEVA DEL CHANGO - PROJECT MANIFEST

## 1. Project Overview
- **Name**: Amate 38 PWA
- **Workspace Location**: `f:\Mike d drive\Mike Webs\Client Projects\Amate and Changa\amate38-pwa`
- **Main PWA URL**: [https://amate38-pwa-final.vercel.app](https://amate38-pwa-final.vercel.app)
- **Live Site**: [https://amate38.com](https://amate38.com)
- **GitHub Repository**: [https://github.com/chatallday/amate38](https://github.com/chatallday/amate38)

## 2. Infrastructure & Credentials

### Supabase Database
- **Project URL**: `https://nycrsxoqfzolketspedi.supabase.co`
- **Project ID**: `nycrsxoqfzolketspedi`
- **Anon Key**: (Stored in `.env` as `VITE_SUPABASE_ANON_KEY`)
- **Service Role Key**: (Stored in `.env` as `SUPABASE_SERVICE_KEY`)

### AI Concierge Orchestration
- **Status**: Decoupled from TinyTalk. Migrated to direct Supabase + Gemini/OpenAI API Orchestration (`api/modules/ai-orchestration`).
- **Gemini Key**: (Stored in `.env` as `GEMINI_API_KEY`)
- **OpenAI Key**: (Stored in `.env` as `OPENAI_API_KEY`)

### Admin Credentials
- **Admin Dashboard**: [https://amate38-pwa-final.vercel.app/admin.html](https://amate38-pwa-final.vercel.app/admin.html)
- **Staff Portal**: [https://amate38-pwa-final.vercel.app/staff.html](https://amate38-pwa-final.vercel.app/staff.html)
- **Authorized Admin Emails**:
  - `anfr@hotmail.com`
  - `mike@dynamicmike.com`
- **Admin Password**: (Stored in `.env` as `ADMIN_PASSWORD`)

### Resend Email Integration
- **API Key**: (Stored in `.env` as `RESEND_API_KEY`)
- **Sending Domain**: `info@amate38.com` (Fallback: `reservations@amate38.com`)

## 3. Operational Rules

### Cuisine & Branding
- **Core Cuisine Type**: Regional Yucatecan food (Comida yucateca tradicional).
- **Tone**: Direct, natural, and raw.
- **Bar Specialties**: Regionally crafted artisanal mezcal, tequila, and craft beer, alongside Mexican wines.

### Operating & Seating Hours
- **Monday – Saturday**: 8:00 am – 10:30 pm (Kitchen orders close at 10:00 pm).
- **Sunday**: 8:00 am – 2:00 pm (Kitchen/restaurant closes at 2:00 pm).

### Reservations Policies
- **Weekend Policy**: Saturdays & Sundays are strictly walk-in only. No online reservations.
- **The 24-Hour Rule**: Online bookings require at least 24 hours advance notice. Under 24 hours must call directly to `+52 (984) 231 2982`.
- **Grace Period**: Strict 10-minute tolerance + 5-minute extension (15 minutes absolute maximum) before the table is released.
- **Blackout Dates**: December 24th and December 31st are completely blocked for reservations on both restaurants.

### Groups Policy
- **4 to 12 Guests**: Requires 48 hours notice.
- **13+ Large Groups**: Requires manual group request via email to `info@amate38.com` with: Name, Date, Time, and Guest Count. Max seated capacity is 100 people, standing is up to 125 people.

### Logistics & Restrictions
- **Accessibility**: Not fully accessible (navigating restrooms requires one step down and one step up).
- **Pet Policy**: Well-behaved dogs on leads welcome only on the outdoor terrace.
- **Dress Code**: Casual beach attire welcome (T-shirt and sandals required).
- **Corks & Cakes**: Birthday cakes welcome with zero service fees. Wine corkage fee is $300 MXN per bottle.
- **AC**: Indoor seating has fans only (NO Air Conditioning).

## 4. Environment & Session Protocols
- **Install Path**: `F:\Antigravity IDE` (All temporary files, storage, and caching must reside on the F: drive).
- **Session Summaries**: Saved in `/wiki/summaries/` following the format `YYYY-MM-DD-Session-Summary.md`.
