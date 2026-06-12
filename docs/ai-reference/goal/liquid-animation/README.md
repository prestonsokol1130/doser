# Liquid Fill Animation

A pure HTML/CSS/JS liquid tank fill animation with wave surface and glow effect.

## Features

- **Smooth fill transition** using `cubic-bezier(0.22, 1, 0.36, 1)` easing
- **Wave animation** at the liquid surface that drifts continuously
- **Glow line** that marks the fill level with a soft shadow
- **Responsive wave visibility** — hides when tank is nearly empty or full
- **Pure CSS animations** — no external libraries required

## How to Use

1. Open `index.html` in a browser
2. Click the percentage buttons to see the fill animate
3. The wave, glow, and fill all move in sync

## Integration into Your Project

### HTML Structure
```html
<div class="tank-wrapper">
  <div class="liquid-fill"></div>
  <div class="glow-line"></div>
  <div class="wave">
    <svg viewBox="0 0 1440 14" width="2880" height="14" preserveAspectRatio="none">
      <path d="M0,7 C90,0 90,14 180,7 ..." fill="none" stroke="#C8E840" stroke-width="2"/>
    </svg>
  </div>
  <div class="content">
    <!-- Your content here -->
  </div>
</div>
```

### CSS
Copy the styles from the `<style>` tag in `index.html`. Key classes:
- `.tank-wrapper` — container
- `.liquid-fill` — the colored liquid
- `.glow-line` — the surface glow
- `.wave` — the animated wave SVG
- `@keyframes waveDrift` — the continuous wave animation

### JavaScript
The `setFill(percentage)` function handles all the positioning:

```js
function setFill(percentage) {
  const clampedPct = Math.max(0, Math.min(100, percentage));
  
  liquidFill.style.height = clampedPct + '%';
  glowLine.style.bottom = `calc(${clampedPct}% - 1px)`;
  wave.style.bottom = `calc(${clampedPct}% - 7px)`;
  
  if (clampedPct > 4 && clampedPct < 97) {
    wave.style.opacity = '1';
  } else {
    wave.style.opacity = '0';
  }
  
  if (clampedPct > 3) {
    glowLine.style.opacity = '0.55';
  } else {
    glowLine.style.opacity = '0';
  }
}
```

## Customization

### Change Colors
Replace `#C8E840` with your color:
- `.liquid-fill` background
- `.glow-line` background and box-shadow
- `.wave svg path` stroke

### Change Wave Speed
Adjust the animation duration in `@keyframes waveDrift`:
```css
animation: waveDrift 3.6s linear infinite; /* Change 3.6s */
```

### Change Fill Speed
Adjust the transition in `.liquid-fill`, `.glow-line`, `.wave`:
```css
transition: height 0.9s cubic-bezier(0.22, 1, 0.36, 1); /* Change 0.9s */
```

### Adjust Wave Height
Change the wave SVG viewBox and height, and update the offset in `setFill()`:
```js
wave.style.bottom = `calc(${clampedPct}% - 7px)`; /* Adjust 7px */
```

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires:
- CSS `calc()` support
- CSS transitions
- SVG support
- JavaScript ES6

## License

Free to use and modify.
