# LA CUEVA DEL CHANGO — OPERATIONAL KNOWLEDGE BASE

> Permanent file-based memory for AI orchestration. This is the source of truth for menus, hours, and policies.
> Tenant ID: `lacuevadelchango` — all Supabase queries must scope to `restaurant_id = 'lacuevadelchango'`.
> Last updated: 2026-08-27

---

## 1. IDENTITY & BRANDING
- **Restaurant**: La Cueva Del Chango
- **PWA Name**: La Cueva Del Chango PWA
- **Tenant ID**: `lacuevadelchango`
- **Cuisine positioning**: Authentic, welcoming, rooted in tradition — warm hospitality with a jungle-cave mystique. (Specific regional focus to be confirmed with owner — placeholder for Yucatecan / Mexican fusion).
- **Tone for AI Assistant**: Welcoming, authentic, knowledgeable local friend. Concise, warm, professional. Never verbose. Mirrors user's language instantly.
- **Bar highlights**: Placeholder — mezcal, tequila, craft beers and Mexican wines (to be curated per La Cueva supplier list).

## 2. OPERATING HOURS
> **TODO**: Owner to confirm final hours. Scaffolding mirrors Amate 38 as starting point.

- **Monday – Saturday**: 8:00 AM – 10:30 PM (Kitchen last orders 10:00 PM)
- **Sunday**: 8:00 AM – 2:00 PM (Kitchen closes 2:00 PM)
- **Reservation windows**:
  - Mon–Fri: 8:00 AM – 9:30 PM
  - Saturday: 2:30 PM – 9:30 PM
  - Sunday: No online reservations (walk-in only — to be confirmed)

## 3. RESERVATION POLICIES
- **The 24-Hour Rule**: Online bookings require ≥24h advance. Under 24h → must call/WhatsApp directly.
- **Weekend Policy**: To be confirmed by owner. Default: Saturday & Sunday walk-in only, no online bookings (cloned from Amate 38).
- **Group thresholds**:
  - 4–12 guests: 48h notice required
  - 13+ guests: Must email `info@lacuevadelchango.com` (placeholder — update with real inbox) with Name, Date, Time, exact Guest Count. AI must instruct guest to include all four fields.
  - Max seated capacity: 100 — standing approx. 125 with canapé layout (placeholder values)
- **Grace period**: 10 min tolerance + 5 min extension (15 min absolute max) before table released.
- **Blackout dates**: December 24 & 31 blocked (placeholder — adjust per owner).
- **Table requests**: Guests may request specific tables/zones when booking.

## 4. LOGISTICS, AMENITIES & RESTRICTIONS
- **Seating**: Indoor jungle/cave atmosphere + outdoor terrace. Indoor fans only, no AC (confirm).
- **Families & Strollers**: Welcome beside tables if space allows, otherwise designated storage.
- **Accessibility**: Confirm accessibility of cave/terrace and restrooms. Document step(s) if any.
- **Pet policy**: Well-behaved dogs on leads — terrace only.
- **Dress code**: Casual beach attire welcome (T-shirt + sandals required).
- **Outside Food & Beverage**:
  - Birthday cakes welcome, zero cakeage fee (confirm)
  - Wine corkage: 300 MXN per bottle (confirm)
- **Device etiquette**: Laptops/calls/music permitted if not disturbing others.

## 5. DIETARY & DAILY SPECIALS
- **Daily specials**: One for breakfast and one for lunch/dinner, changes daily. If asked: "Please contact the restaurant directly for today's special."
- **Allergies**: Accommodated if flagged clearly in advance to kitchen.
- **Vegan & Vegetarian**: Dedicated permanent options (expand when menu finalizes).

## 6. PAYMENTS & FACTURAS
- **Currencies**: MXN, USD, EUR, CAD (confirm current).
- **Cards**: Visa, Mastercard, AMEX.
- **Facturas**: Must be requested within same calendar month of service via email.

## 7. CONTACT
- **Phone**: +52 (984) 231 2982 (placeholder — update with La Cueva number)
- **Email**: info@lacuevadelchango.com (placeholder)
- **WhatsApp**: https://wa.me/529842312982 (placeholder)
- **Address**: To be confirmed — update once owner provides full street address
- **Website / menu links**: Populate once domain live (e.g. https://lacuevadelchango.com/desayuno/ etc.)

## 8. MENUS
> Menus to be ingested here. Keep Spanish + English URLs paired. When live, list:
> - Desayuno / Breakfast
> - Comida / Lunch
> - Cena / Dinner
> - Vegano / Vegan
> - Postres / Desserts
> - Bebidas / Beverages
> - Vinos / Wines
> - Eventos grupales / Group Events (Canapés, Menu1-4)

### Spanish (placeholder structure)
- [Desayuno](https://lacuevadelchango.com/desayuno/)
- [Comida](https://lacuevadelchango.com/comida/)
- [Cena](https://lacuevadelchango.com/cena/)
- [Vegano](https://lacuevadelchango.com/vegano/)
- [Postres](https://lacuevadelchango.com/postres/)
- [Bebidas](https://lacuevadelchango.com/bebidas/)
- [Vinos](https://lacuevadelchango.com/vinos/)

### English (placeholder)
- [Breakfast](https://lacuevadelchango.com/en/breakfast/)
- [Lunch](https://lacuevadelchango.com/en/lunch/)
- [Dinner](https://lacuevadelchango.com/en/dinner/)
- [Vegan](https://lacuevadelchango.com/en/vegan/)
- [Desserts](https://lacuevadelchango.com/en/desserts/)
- [Beverages](https://lacuevadelchango.com/en/beverages/)
- [Wines](https://lacuevadelchango.com/en/wines/)

### Group events (4+ people) — placeholder
- [Canapés](https://lacuevadelchango.com/canapes-2/)
- [Menu 1](https://lacuevadelchango.com/menu1/)

## 9. CUSTOMER FEEDBACK LOOP
- **Low reviews (<3 stars)**: AI does not troubleshoot. Thanks guest, notes management checks every comment and will reply via email.

## 10. AI GUARDRAILS
- Language mirroring: detect user's language on latest message, reply ONLY in that language.
- Keep replies ultra-short (1–2 sentences) unless listing options or reservation bullets.
- Off-topic offboarding: "Sorry, we do not have that information." / "Lo siento, no contamos con esa información."
- Reservation confirmation must append JSON tag: `<RESERVATION>{"date":"YYYY-MM-DD", "time":"HH:MM", "guests":"N", "name":"...", "email":"..."}</RESERVATION>`
- Relative date resolution: use real-time context anchor as ground truth for "today".

---
*This file is file-based permanent memory. Edits here are the cheapest way to steer the AI — no prompt retraining needed.*
