# Project Context

## Project

Repository/project name: `login`

## Concept

This is a long-term companion web gift for a friend preparing for Gaokao. The core idea is: life is not only the exam; the friend can keep collecting future places, wishes, memories, and dreams on a 3D Earth.

## Current UX

1. Opening screen
   - Uses `assets/opening.jpg`
   - Shows `Loading memories...`, progress bar, and percentage
   - Loading UI is positioned to avoid covering the main wallpaper content

2. Main screen
   - Soft yellow dotted background
   - Three.js textured 3D Earth in the center
   - Mailbox icon in the top-left using `assets/mailbox.png`

3. Earth interaction
   - Drag to rotate the Earth
   - Auto-rotation pauses while hovering or interacting
   - Raycaster hit point is converted into Earth local coordinates with the inverse world matrix before calculating latitude/longitude
   - GeoJSON is used to identify country/region
   - Country borders are drawn on the globe
   - Hovering a country highlights it and shows tooltip
   - Clicking fills the place field automatically

4. Postcard memory form
   - Left side: photo upload and handwritten note area
   - Right side: place, date, type, and stamp
   - Stamp image is chosen from preset country/region scenery
   - Submit button says `寄出`

5. Mailbox scrapbook
   - Saving a memory creates stars on Earth
   - Envelope flies from the clicked point into the mailbox
   - Mailbox shows unread count
   - Clicking the mailbox opens a CSS 3D page-flip scrapbook
   - Supports edit current page, delete current page, and clear all memories

## Important Files

- `index.html`: app structure
- `styles.css`: visual design and animations
- `app.js`: Three.js Earth, GeoJSON recognition, memories, scrapbook
- `server.js`: local preview server
- `assets/opening.jpg`: opening wallpaper
- `assets/mailbox.png`: mailbox icon

## Publishing

Upload the project files to GitHub repository `evelynyyyyy/login`, then enable GitHub Pages from the repository settings.
