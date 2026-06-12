# v0 Prompt — Doser Tools + Settings Hub Redesign

Copy and paste the prompt below into v0. Pair it with fresh repo-owned screenshots when available.

```text
Redesign two mobile-first hub screens for an existing app called Doser: the Tools hub and the Settings hub.

This is not a full app redesign. Do not change the product theme, visual language, or navigation model. Improve hierarchy, organization, clarity, and polish while staying inside the existing Doser design system.

Context:
- Doser is a dark-theme harm-reduction PWA for GBL, BDO, and GHB users.
- The app helps users track dose timing, review patterns, and make safer redosing decisions.
- It is not a medical device and should not feel playful, gamified, glossy, or lifestyle-branded.
- The current Tools and Settings hubs are functional but too plain. They are mostly simple list rows right now.
- I want a version that is more intentional, better organized, and visually stronger, while still feeling like the same app.

Your job:
- Design a better Tools hub screen
- Design a better Settings hub screen
- Keep them clearly related to each other
- Keep the sub-screen destinations the same
- Show more useful information directly on the hub items so users can scan status without opening every section

Important product constraint:
- These screens are hub/navigation screens only.
- Do not redesign the inner Stash, Dose Buddy, Taper, Account, Profile, Notifications, Themes, Install, or Legal screens.
- Focus on the top-level presentation, information hierarchy, summary states, grouping, and component styling of the hub pages.

Platform and layout:
- Mobile-first
- Reference width: 390px
- Safe-area aware
- Bottom nav already exists elsewhere in the app
- Build the screens as React + Tailwind UI concepts
- Use CSS variable-driven colors in the Tailwind classes when appropriate, for example `bg-[var(--app-surface)]`

Existing Doser design system you must follow:

Colors:
- `var(--app-bg)` = app background
- `var(--app-surface)` = main card background
- `var(--app-surface-alt)` = secondary surface
- `var(--app-divider)` = borders and dividers
- `var(--app-text)` = primary text
- `var(--app-dim)` = secondary text
- `var(--app-faint)` = inactive or low-emphasis text
- `var(--color-ring)` = primary accent for active states
- `var(--color-action)` = action / warning / destructive accent
- `var(--color-load)` = secondary accent / supporting labels

Typography:
- `var(--font-display)` for large numeric values only
- `var(--font-heading)` for titles and section headings
- `var(--font-body)` for all UI labels, descriptions, and buttons

Hard rules:
- No gradients
- No drop shadows
- No glassmorphism
- No light mode
- No white cards
- No purple-heavy drift
- No generic shadcn dashboard feel
- No emoji
- No lowercase styling system except the existing brand wordmark `doser`
- Buttons and UI labels should stay uppercase
- Descriptive supporting text should stay sentence case
- Use card radius around 16px
- Use icon button radius around 10px
- Use primary button radius around 14px
- Use gaps for layout rhythm instead of scattered margin hacks

Desired visual direction:
- Stronger hierarchy than a plain list
- A compact top summary area is welcome if it helps orientation
- Section grouping is welcome if it improves scanability
- Hub cards can include left icon, title, description, right-side status, mini stat, badge, or supporting metadata
- Think “calm clinical utility” rather than “consumer wellness app”
- Feel precise, modern, and tactile without becoming flashy

Information architecture for the Tools hub:
- Header title: Tools
- Supporting subtitle: Harm reduction utilities

Destinations and what each row/card should communicate:
1. Stash
   - Explain what it is: supply tracking
   - Show useful live summary directly on the hub item
   - Surface examples:
     - current remaining mL
     - remaining percent
     - low-supply warning state when relevant
   - This should be the most information-rich item on the Tools hub

2. Dose Buddy
   - Explain what it is: supportive pre-dose check-ins and safer suggestions
   - Show useful summary directly on the hub item
   - Surface examples:
     - enabled or off
     - check-in before dose on/off
     - recommendation support active

3. Taper
   - Explain what it is: gradual dose reduction planning
   - Show useful summary directly on the hub item
   - Surface examples:
     - active or inactive
     - if active, show today’s target dose
     - optionally show next step timing

4. Emergency Resources
   - Explain what it is: urgent help and crisis resources
   - This should read clearly and immediately, but not dominate the whole page
   - It can use a more alert treatment, but keep it inside the same theme

5. Safety Reference
   - Explain what it is: timing basics and harm-reduction reference
   - Keep this calm and informational

Information architecture for the Settings hub:
- Header title: Settings
- Supporting subtitle: Account and preferences

Destinations and what each row/card should communicate:
1. Account
   - Show signed-in email status directly on the hub item

2. Profile
   - Explain what it controls: body profile and dose defaults
   - Show useful summary directly on the hub item
   - Surface examples:
     - nickname if present
     - preferred dose defaults exist

3. Notifications
   - Explain what it controls: reminders and alerts
   - Show useful summary directly on the hub item
   - Surface examples:
     - whether dose reminders are on
     - whether daily summary is on
     - whether stash low alert is on

4. Themes
   - Explain that the app uses one dark theme
   - Show current state directly on the hub item: Dark only

5. Install App
   - Explain that Doser can be added to the home screen
   - Show a compact install-state style treatment if useful

6. Legal
   - Explain that this contains terms and privacy
   - Keep clear but lower-emphasis than core account/profile controls

Structural ideas you are allowed to use:
- Grouped sections such as “Tracking tools”, “Support”, “Account”, “App”
- Compact utility summary card at the top of each hub
- More expressive hub cards with primary label, secondary explanation, and right-aligned status data
- Inline chips or pills for states like LOW, ACTIVE, OFF, DARK, ON
- Small numeric summaries where they add real value

Structural ideas to avoid:
- Huge hero artwork
- Fancy empty decoration that does not improve use
- Desktop-style analytics dashboard layout
- Big marketing blocks
- Overbuilt cards that hide the fact that these are navigation surfaces

Output request:
- Return two polished mobile screen concepts:
  - Tools hub
  - Settings hub
- Use shared reusable card primitives where appropriate
- Keep the design implementation-minded and believable for a production React/Tailwind app
- Prefer concise placeholder data that demonstrates the intended summaries

Sample placeholder summaries you can use:
- Stash: 86.4 mL remaining · 72%
- Dose Buddy: Enabled · Check-in before dose on
- Taper: Active · Today 1.60 mL
- Emergency Resources: Crisis lines and urgent help
- Safety Reference: Timing and harm-reduction basics
- Account: preston@example.com
- Profile: Preston · GBL + BDO defaults saved
- Notifications: Dose reminders on · Daily summary off
- Themes: Dark only
- Install App: Ready to add to home screen
- Legal: Terms of use and privacy policy

Design intent:
- Make both pages feel noticeably better than a flat list
- Make them easier to scan
- Make each destination easier to understand before tapping
- Preserve the app’s existing dark, restrained, clinical design language
```
