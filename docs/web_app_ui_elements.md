# Prompt 1

You are redesigning the IVA Government Schemes Portal homepage into a modern, cinematic, responsive landing page using the provided background assets:

- /ui_assets/homebgdark.png
- /ui_assets/homebglight.png

Core goal:
Make the homepage feel premium, dynamic, and trustworthy, while keeping the existing app functionality intact. The page should no longer feel like a flat static screen. It should feel like a polished public-service platform with motion, depth, and strong visual hierarchy.

Background handling:
- Use homebgdark.png for dark mode.
- Use homebglight.png for light mode.
- Switch automatically based on theme.
- Do not treat the background as a generic wallpaper. Compose the UI around it.
- The images have important people and illustration clusters around the edges, with a large visual opening in the center. Keep the main content inside that open center area.
- Avoid placing major text or cards on top of the busy corner clusters or the bottom skyline area.
- Add a subtle overlay, but preserve the artwork and its visual richness.

Layout strategy:
- Keep the hero content centered in the large empty middle area.
- Place the logo, title, subtitle, and CTA buttons in a strong vertical stack.
- Use a maximum width so the hero feels intentional and not too spread out.
- Position the feature cards below the hero in the lower-middle area, aligned neatly and balanced with the background artwork.
- Ensure the navigation remains clean and accessible at the top.

Animation requirements:
1. Loading / preloader sequence
   - When the site opens, show the IVA logo as a branded loading state.
   - Make it feel like the portal is preloading scheme data and app resources.
   - Use a refined loader, not a basic spinner.
   - After loading, smoothly transition the logo into the hero area.
   - Animate the headline and body copy with a gentle fade + slide-in.
   - Stagger the appearance of buttons and feature cards.

2. Hero motion
   - The hero should enter with subtle premium motion.
   - Keep easing smooth and professional.
   - No flashy effects, no excessive bouncing.

3. Theme motion
   - When switching between light and dark mode, transition the background image smoothly.
   - Do not hard cut between versions.
   - Preserve readability during the transition.

Visual style:
- Modern landing page, clean and elegant.
- Use glassmorphism lightly, not excessively.
- Use soft shadows, rounded corners, and refined spacing.
- Keep the government/citizen-support identity serious, approachable, and credible.
- The design should feel contemporary, not playful or cartoonish.

Typography:
- Strong, clear headline.
- Smaller supporting paragraph with excellent readability.
- CTA buttons should be prominent and well-spaced.
- Use a clear hierarchy so the user immediately understands the purpose of the portal.

Buttons and interactions:
- Primary CTA: “Find Schemes for Me”
- Secondary CTA: “Explore Scheme Directory”
- Add smooth hover states and subtle elevation.
- Keep the existing top-right controls for language, theme toggle, find schemes, and login.

Feature cards:
- Keep the existing content categories, but redesign them into more premium cards.
- Add icons, spacing, soft borders, and hover elevation.
- Make them responsive and aligned with the background composition.
- Avoid bulky boxes that block the artwork.

Responsiveness:
- Desktop:
  - Use the full visual power of the backgrounds.
  - Place hero content in the center opening.
  - Keep the page balanced and spacious.
- Tablet/mobile:
  - Stack content cleanly.
  - Ensure no text overlaps important image subjects.
  - Keep the background visible but muted enough for readability.

Implementation expectations:
- Refactor the homepage into reusable components if needed.
- Use theme-aware background selection.
- Use a dedicated loading/intro component.
- Keep the app routes and existing functionality unchanged.
- Make the final result feel like a production-grade portal.

Important composition note:
The background artwork has people and illustrations arranged around the edges, with the center intentionally open. Use that center opening as the visual anchor for the hero content. Do not cover the important faces or corner illustrations. The UI should feel integrated with the art, not pasted on top of it.

Final outcome:
A modern, animated, theme-aware landing page for IVA that feels dynamic, polished, and ready for a real citizen-service product.

# prompt 2

You are improving the IVA Scheme Directory / Scheme Detail page behavior and readability.

Goal:
Make the right-side scheme reading pane behave like a dedicated reader panel with its own scroll bar, while the main page layout stays fixed and does not scroll. Also improve the content structure so it reads like a proper scheme document, with clear sections, tables, and lists. Fix the scheme selection behavior so the selected scheme is not forced to appear at the top of the list.

Required UI behavior changes:

1. Independent scrolling for the reading pane
- The right-side scheme detail panel must have its own vertical scroll bar.
- The main page/container should remain fixed and should not scroll.
- Only the reading pane should scroll when the user reads a scheme.
- Keep the left scheme list visible and stable while reading.

2. Structured, reader-friendly scheme content
- Rewrite the scheme detail layout so it is easier to read and scan.
- Use clear section headings such as:
  - Overview
  - Benefits
  - Eligibility
  - Required Documents
  - How to Apply
  - Important Notes
  - Official Source / Department
- Present information in a more organized format.
- Use tables where appropriate for:
  - Benefit type
  - Beneficiary type
  - Target group
  - Document checklist
  - Department / state / category metadata
- Use bullet lists for eligibility criteria, benefits, and application steps.
- Reduce long paragraph blocks and break them into digestible sections.
- Improve spacing, hierarchy, and typography so the page feels like a real document viewer.

3. Selected scheme should not jump to the top of the list
- When a scheme is selected from the list, do not move that scheme card to the top.
- Keep the list order unchanged.
- The selected scheme should remain in its original position in the list.

4. Auto-scroll to the selected scheme’s original position
- When the user opens a scheme from:
  - My Saved Schemes
  - Schemes For Me
  - Any direct selection action
- The left list should automatically scroll to the scheme’s actual location in the list.
- Example: if the scheme is item 400, the page should jump/scroll to that item’s position in the list instead of reshuffling the list.
- The selected item should be highlighted in place.
- The list should preserve its order and pagination behavior.

5. Better selected-state handling
- Highlight the selected scheme clearly in the list.
- Keep the detail pane synced with the selected item.
- Do not duplicate the selected scheme at the top of the list.
- Do not reorder results just because the user selected one item.

Implementation expectations:
- Use a fixed-height container for the main page.
- Make the left list and the right detail pane independent scroll regions where needed.
- Ensure the detail pane fills the available height and scrolls internally.
- Preserve existing navigation, search, saved schemes, and “schemes for me” flows.
- Keep the UI clean, modern, and accessible.
- The page should feel like a proper government scheme explorer, not a simple static card view.

Quality bar:
- The list should stay stable.
- The reading pane should feel like a document viewer.
- The content should be easier to understand for regular users.
- Scrolling behavior should feel intentional and polished.

Do not change backend data logic unless necessary. Focus on UI layout, selection behavior, scroll behavior, and content presentation.'

# Prompt 3

You are redesigning the IVA AI Scheme Voice Assistant so it behaves like a floating assistant bubble that opens a chat popup, rather than a dedicated full-page tab.

Goal:
Convert the current assistant screen into a traditional website-style floating assistant experience. The assistant should be accessible from a small bubble/button on the main portal, and when clicked, it should open a chat popup or drawer where the user can ask questions and continue the conversation. Do not keep the assistant as a standalone full page in the main navigation flow.

Core behavior:
- Remove the dedicated assistant-tab style page experience.
- Replace it with a floating assistant bubble, widget, or launcher button.
- Clicking the bubble opens a chat popup/modal/drawer.
- The popup should allow the user to chat naturally and continue the conversation inside the popup.
- The assistant should feel lightweight, helpful, and always available without interrupting the main site.

Layout and integration:
- The bubble should sit in a fixed position on the portal, typically bottom-right, unless the current layout requires a better unobtrusive placement.
- The bubble must be visible on all major pages, including Home, Scheme Directory, and Scheme Detail pages.
- The popup should open above the page content without breaking the underlying layout.
- The main website should remain usable while the assistant is closed.
- The assistant should not take over the entire page unless the screen size is very small and a fullscreen fallback is necessary on mobile.

Theme consistency:
- The assistant bubble, popup, message cards, input area, headers, icons, and borders must follow the exact IVA theme used across the site.
- Support both light and dark mode automatically.
- Use the same green/olive/cream palette and the same visual language as the rest of the portal.
- The popup should feel like a natural extension of the portal, not a separate app.
- Match button radius, shadows, spacing, and typography with the main website.

UI design requirements:
- Bubble:
  - Compact and elegant.
  - Use a speech/assistant icon or microphone/chat icon.
  - Include a subtle hover animation.
  - May include a soft pulse or glow to indicate availability.

- Popup:
  - Rounded, polished container.
  - Header with assistant name, small icon, and close button.
  - Scrollable conversation area.
  - Fixed input bar at the bottom.
  - Clean message bubbles with clear user/assistant distinction.
  - Use readable typography and good spacing.
  - Keep the interface simple for citizens of all ages.

Assistant content style:
- Make the assistant friendly and supportive.
- It should be able to answer questions about eligibility, documents, benefits, application steps, and scheme discovery.
- It should support multilingual interaction if already part of the system.
- Responses should be structured and easy to read.
- Keep the assistant answers concise by default, but allow follow-up detail inside the popup.

Behavior rules:
- The assistant should not be shown as a separate dedicated page in the main navigation.
- The page content should not shift or resize aggressively when the popup opens.
- The assistant popup should close cleanly when the user clicks outside it, presses escape, or taps the close icon.
- Preserve conversation state while the popup remains open.
- Keep scrolling confined to the popup conversation area, not the entire page.
- Make sure the popup works well on desktop and mobile.

Mobile behavior:
- On mobile, the assistant bubble should remain easy to reach.
- The popup may expand to a full-screen chat sheet on small screens if needed, but it should still feel like the same assistant widget.
- Keep the same theme and clean spacing.

Implementation expectations:
- Refactor the assistant into a reusable floating widget component.
- Do not break existing scheme search, scheme detail, saved schemes, or homepage functionality.
- Integrate the assistant launcher globally so it is available across the portal.
- Use the existing IVA design system, colors, and visual style.
- Keep the code clean and modular.

Important:
- Do not create a separate “Assistant” full page experience.
- Do not make the assistant feel like a sidebar admin tool.
- Do not make the popup visually inconsistent with the rest of the portal.
- The assistant should feel like a helpful citizen-facing chat helper that floats over the website.

Final outcome:
A floating IVA assistant bubble that opens into a polished chat popup, fully theme-matched to the portal, accessible from anywhere on the site, and visually consistent with the modern government-schemes website.

# Prompt 4

