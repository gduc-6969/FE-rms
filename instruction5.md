You're absolutely right – forcing customers to log in before they can even see the restaurant or browse the menu creates friction and can drive them away. A landing page should **welcome, inform, and entice** before asking for any credentials.

Below is a recommended **landing page structure** that prioritizes restaurant introduction, followed by a clear path to booking (which may or may not require login later in the flow). This aligns with your dark theme and the home page improvements we discussed earlier.

---

## Recommended Landing Page Flow

```
Public Landing Page (no login required)
    ↓
Explore: Menu, Photos, Chef’s story, Reviews
    ↓
Start booking (choose guests, date, time)
    ↓
Only at the final step: “Complete booking – Sign in or continue as guest”
```

This way, login becomes **optional** or **delayed** until necessary (e.g., to save a reservation or access history).

---

## Landing Page Content Blocks (Dark Theme)

### 1. Hero Section (Full‑bleed image or video)
- **Background:** High‑quality video or slideshow of the restaurant interior, signature dish, or chef at work. Overlay `rgba(0,0,0,0.6)` for text contrast.
- **Headline:** “La Cuisine Moderne” (or your restaurant name) in elegant serif, gold accent.
- **Tagline:** “Fine Dining in the Heart of the City – Reserve Your Table.”
- **Primary CTA:** “Book a Table” (gold button, large) – starts the booking flow without login.
- **Secondary CTA:** “Explore Our Menu” (outline button) – scrolls to menu preview.

### 2. Quick Booking Widget (Optional but recommended)
- A compact widget (Date, Time, Guests) right below or overlapping the hero.  
- Allows instant search for available slots.  
- If the user is not logged in, they can still check availability – only at confirmation we ask for contact info.

### 3. Introduction / Story
- “About Us” section with a short, warm description of the restaurant’s philosophy, chef’s background, and unique selling points (e.g., locally sourced, seasonal menu).
- Use two columns: text (left) and an atmospheric image (right).

### 4. Menu Preview
- Show 3–4 signature dishes with mouth‑watering photos, names, and brief descriptions.
- Link to full menu page (still no login required).

### 5. Chef’s Recommendations (Carousel)
- Highlight 3 dishes with “Chef’s pick” badge (gold).  
- Interactive hover/tap for more details.

### 6. Photo Gallery / Ambiance
- A grid of interior, exterior, and event photos.  
- Auto‑play lightbox on click.

### 7. Customer Reviews / Testimonials
- 2–3 short, authentic quotes with names and (optional) star ratings.  
- Use a subtle card design (`#1A1A1A` background, gold quote icon).

### 8. Footer
- Address, opening hours, contact phone/email, social media icons.  
- Links to Privacy Policy, Terms, and **Login / Sign up** (small, secondary).

---

## Where to Place Login / Sign Up

Instead of a full‑screen login, add a **top bar** or **profile icon** that shows:
- “Sign in” / “Register” (if not logged in)
- “My Table” (if logged in)

This keeps login accessible but not intrusive. Example:

```
[Logo]  [Home] [Menu] [Reservation] [Contact]   [👤 Sign In]   [☰]
```

On mobile, the profile icon can live in the hamburger menu.

---

## Delayed Login Flow (Booking Path)

1. User clicks “Book a Table” on landing page.
2. They select guests, date, time, and table (as per your reservation improvements).
3. On the final confirmation step, show:
   - Summary of booking details.
   - Two options:
     - **“Complete as guest”** – ask only for name, email, phone (no password).
     - **“Sign in to save this reservation”** – redirects to login/register, then returns to confirm.
4. After successful booking (guest or logged in), show a confirmation page with option to create an account for future bookings.

This reduces abandonment because users aren't forced to create an account just to see availability.

---

## Technical Implementation Advice

- **Routes:**  
  - `/` → Landing page (public)  
  - `/menu` → Public menu  
  - `/reservation` → Booking flow (public until confirmation)  
  - `/login`, `/register` → Authentication pages  
  - `/my-table` → Requires login (user's upcoming reservations)

- **State management:** Store booking selections in local storage or session storage so if the user logs in mid‑flow, they don’t lose their choices.

- **Guest booking:** Create a reservation record with a guest user ID or just store the contact info. Send an SMS/email confirmation with a magic link to edit/cancel the booking (no password needed).

---

## Visual Design Consistency (Dark Theme)

- Use the same `#0F0F0F`, `#1A1A1A`, `#C5A028` palette across landing and booking pages.  
- Buttons, icons, and links should feel cohesive.  
- The landing page should immediately convey luxury and warmth, not a cold authentication wall.

---

By making these changes, your first screen becomes an inviting storefront rather than a barrier. Customers can explore, fall in love with the restaurant, and book a table with minimal friction – only providing contact details when they are already committed. This is the industry best practice (see OpenTable, Resy, Tock).