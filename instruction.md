Design Prompt: Restaurant Booking System – Customer Template
Objective
Create a modern, mobile‑first booking interface for a restaurant management system. The design must use a dark theme (black background) with a warm metallic accent, emphasize clarity and speed for table reservations, and follow the “Card & Timeline” layout pattern.

1. Overall Layout & Structure
Device: Mobile‑first (breakpoints: 375px, 768px, 1280px).

Layout Pattern: Horizontal stepper at the top (Date → Time → Guests → Details) followed by a card‑based content area.

Sticky Footer: A booking summary card that remains fixed at the bottom of the viewport on mobile, containing the selected details and a prominent “Confirm Booking” button.

2. Color Palette (Dark Theme)
Role	Hex	Usage
Background base	#0F0F0F	Main page background.
Surface / Cards	#1A1A1A	Background for cards, modals, and the sticky footer.
Elevated surface	#242424	Hover states, active chips, input fields.
Primary text	#F0F0F0	Headlines, important labels.
Secondary text	#A0A0A0	Helper text, placeholder text, timestamps.
Accent (primary)	#C5A028	CTA buttons, selected states (chips, segmented control), focus outlines, icons.
Accent hover	#D4AF37	Hover state for accent elements.
Success	#2BAE66	Available table indicators, confirmation messages.
Error	#E06C6C	Error messages, unavailable time slots.
Border	#2C2C2C	Dividers, card borders, input borders.
Important:

Never use pure black (#000000) as background.

All text must meet WCAG AA contrast against its background (minimum 4.5:1 for normal text).

3. UI Components & Their States
3.1 Horizontal Stepper
Steps: Date, Time, Guests, Your Details.

Inactive: Gray (#A0A0A0) text, thin border below.

Active: Accent color (#C5A028) text, thick border below.

Completed: Accent checkmark icon, thin border below.

3.2 Date & Time Selection
Display: Horizontal scrollable row of pill‑shaped chips.

Chip (unselected): Background #242424, text #F0F0F0.

Chip (selected): Background #C5A028, text #0F0F0F (dark text for contrast).

Chip (unavailable): Background #1A1A1A, text #5A5A5A, strikethrough optional.

Time slots: Show only the next 7 days. Highlight “Most popular” times with a small tag (accent border, text #C5A028).

3.3 Guests Selector
Use a stepper with plus/minus buttons inside a card.

Buttons: Circle, background #242424, icon #C5A028.

Display guest count prominently. Show capacity warning if exceeding table limit.

3.4 Table Type / Area Toggle (Optional)
Segmented control with three options (e.g., Indoor, Outdoor, Bar).

Active: Background #C5A028, text #0F0F0F.

Inactive: Background #242424, text #F0F0F0.

Smooth transition on hover/tap.

3.5 Booking Summary Card (Sticky Footer)
Background #1A1A1A, border top #2C2C2C.

Displays: date, time, guest count, table type (if selected).

CTA Button: Background #C5A028, text #0F0F0F, rounded corners (12px).

On hover/tap: Background #D4AF37.

Padding: 20px horizontally, 16px vertically.

3.6 Form Inputs (Your Details)
Labels: #A0A0A0, small uppercase tracking.

Input fields: Background #242424, border #2C2C2C, text #F0F0F0, padding 14px.

Focus state: Border #C5A028, subtle outer glow (0 0 0 2px rgba(197,160,40,0.4)).

Error state: Border #E06C6C, error message below.

4. Typography
Font family: Sans‑serif (Inter, Montserrat, or similar).

Headings:

H1: 28px, weight 600, #F0F0F0.

H2: 20px, weight 600, #F0F0F0.

Body: 16px, weight 400, #F0F0F0.

Small / Helper: 14px, weight 400, #A0A0A0.

Button text: 16px, weight 600, uppercase optional.

5. Visual Effects & Depth
Cards: Rounded corners (16px), subtle shadow (0 4px 12px rgba(0,0,0,0.3)).

Focus indicators: Use accent glow, never remove default outline entirely.

Icons: Line icons, stroke width 1.5px, color #A0A0A0. Active states change to #C5A028.

Transitions: All interactive elements have transition: all 0.2s ease.

6. Accessibility Requirements
All interactive elements must be keyboard navigable.

Color is not the only differentiator; selected states must include an icon or border in addition to color change.

Form fields must have associated <label> elements.

Touch targets: minimum 44x44px for buttons and chips.

Screen reader announcements for dynamic changes (e.g., “Time slot 7:00 PM selected”).

7. Responsive Behavior
Mobile (≤ 768px):

Stepper uses icons + labels; chips scroll horizontally.

Sticky footer fixed to bottom.

Desktop (≥ 1024px):

Layout can shift to two columns (left: floor plan or image gallery; right: booking form).

Keep sticky summary on the right side, not bottom.

Chips display in a grid rather than horizontal scroll.

8. Assets & Micro‑interactions
Hero image (optional): Full‑bleed at top with overlay (rgba(0,0,0,0.6)) to keep text readable.

Success confirmation: After booking, display a full‑page confirmation with booking details and a “Back to home” button.

Loading states: Skeleton screens for content, spinner in accent color.

Empty states: Friendly messages with illustrations (e.g., “No available times? Try another date”).

9. Deliverables Expected
Figma / Sketch file with components, variants for all states (default, hover, selected, disabled, error).

Interactive prototype linking the stepper flow.

Design system documenting colors, typography, spacing, and component specs.

Responsive layouts for mobile, tablet, and desktop.

10. Notes for the Designer
The target audience is restaurant customers; the design must feel luxurious yet intuitive.

The black background should evoke premium atmosphere (cocktail bars, fine dining) but remain readable under bright sunlight (test contrast).

Speed is critical: minimize form fields, prioritize selection over typing.