# Design System Document

## 1. Overview & Creative North Star: "The Living Archive"
This design system moves away from the rigid, boxy layouts typical of academic institutions. Our Creative North Star is **"The Living Archive."** It treats the digital space as a premium, curated editorial experience—blending the prestige of a physical Ivy League library with the fluid, effortless navigation of a modern digital flagship. 

To break the "standard template" feel, this system prioritizes **intentional asymmetry** and **tonal depth**. We eschew traditional grid-lines in favor of a "layered paper" philosophy. Information isn't just displayed; it is presented on a hierarchy of surfaces that feel physical, high-end, and intellectually organized.

---

## 2. Colors & Surface Architecture
The palette is rooted in `primary` (#001e40) to establish authority, balanced by an expansive range of "Surface" tokens that allow for sophisticated environmental layering.

### The "No-Line" Rule
**Borders are strictly prohibited for sectioning.** To define the boundary between the "Hero" and "Features" sections, do not use a 1px line. Instead, transition from `surface` (#f8f9fa) to `surface-container-low` (#f3f4f5). This creates a sophisticated, "quiet" transition that feels modern and expensive.

### Surface Hierarchy & Nesting
Treat the interface as a series of stacked sheets. 
- **Base Layer:** `surface` (#f8f9fa).
- **Secondary Content Areas:** `surface-container-low` (#f3f4f5).
- **Interactive Cards/Modules:** `surface-container-lowest` (#ffffff).
- **Elevated Overlays:** `surface-bright` (#f8f9fa).

### The "Glass & Gradient" Rule
To prevent the deep blues from feeling flat or "government-like," use **Signature Textures**. 
- **Hero Backgrounds:** Use a linear gradient from `primary` (#001e40) to `primary_container` (#003366) at a 135-degree angle. 
- **Navigation Bars:** Utilize a Glassmorphism effect. Apply `surface_container_lowest` at 80% opacity with a `backdrop-blur` of 20px. This allows high-impact hero imagery to bleed through subtly, grounding the UI in the site's photography.

---

## 3. Typography: Editorial Authority
We utilize a dual-font strategy to balance character with utility. 

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and modern "tech-forward" academic feel. Use `display-lg` for impactful admissions statements. The wide apertures of Manrope convey a "welcoming" and "open" campus culture.
*   **Body & Labels (Inter):** The workhorse of the system. Inter provides maximum legibility for complex academic course descriptions and long-form research papers.

**Hierarchy as Identity:**
- **The Power Gap:** Create a high-contrast scale. Pair a `display-md` headline with a `body-md` description. The significant jump in scale creates a "magazine" feel that looks intentional and designed, rather than "generated."

---

## 4. Elevation & Depth
Depth is a functional tool, not a decoration. We use **Tonal Layering** to guide the eye.

### The Layering Principle
Rather than shadows, use color shifts. An "Admissions Deadlines" card should be `surface-container-lowest` (pure white) sitting on a `surface-container` (#edeeef) background. This provides a "soft lift" that feels architectural.

### Ambient Shadows
When an element must float (e.g., a "Apply Now" FAB or a dropdown menu), use **Ambient Shadows**:
- **Shadow Token:** `0 20px 40px rgba(0, 27, 60, 0.06)`. 
- By tinting the shadow with the `on_primary_fixed` color rather than pure black, the shadow feels like natural light passing through a collegiate environment.

### The "Ghost Border" Fallback
If a container sits on an identical background color and requires definition, use a **Ghost Border**: `1px solid outline_variant` (#c3c6d1) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons: The "Scholar" Action
- **Primary:** `primary` (#001e40) background with `on_primary` (#ffffff) text. Use `md` (0.375rem) roundedness. Use a subtle gradient (Primary to Primary Container) to give the button a "weighted" feel.
- **Secondary:** Use `secondary_container` (#c9e2fd) with `on_secondary_container` (#4d657b). This provides a lower-emphasis alternative for "View Curriculum."
- **Tertiary:** Text-only using `primary`. Use for "Read More" links.

### Cards: The "Portfolio" Module
- **Rules:** No borders. No dividers. 
- **Structure:** Use `surface_container_lowest` (#ffffff). Use `xl` (0.75rem) roundedness for a modern, welcoming feel. 
- **Separation:** Use vertical white space (32px or 48px) to separate content sections within the card rather than horizontal lines.

### Inputs: The "Clean Slate"
- **Default:** `surface_variant` (#e1e3e4) background with a bottom-only "Ghost Border." 
- **Focus:** Transition the bottom border to `primary` (#001e40) with a 2px thickness. 

### Academic Components (Custom)
- **Course Chips:** Use `secondary_fixed` (#cce5ff) with `on_secondary_fixed` (#011d31). These should be `full` rounded (capsule style).
- **The "Faculty Spotlight" Card:** An asymmetrical card where the image overlaps the container edge by -24px, breaking the grid to create a bespoke, high-end editorial look.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use `tertiary` (#381300) sparingly as a "Warm Highlight" for urgent alerts or special "Founders Day" notices to break the sea of blue.
*   **Do** prioritize "Breathing Room." If you think there is enough margin, add 16px more. High-end design thrives on whitespace.
*   **Do** use `body-lg` for introductory paragraphs to maintain an authoritative, easy-to-read "Dean’s Welcome" feel.

### Don't:
*   **Don't** use 1px solid dividers to separate list items. Use 8px of vertical space and a very subtle `surface-container` background hover state.
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#191c1d) to maintain a soft, premium contrast.
*   **Don't** use "Default" blue links. Use the `primary` token with a `title-sm` weight for all interactive anchors.