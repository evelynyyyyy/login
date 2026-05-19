# login

An interactive web gift built for a friend. It opens with a custom loading screen, then enters a 3D Earth memory map. Users can click the globe, write postcard-style memories, upload photos, and collect them inside a mailbox scrapbook.

## Features

- Opening loading animation
- Three.js textured 3D Earth
- GeoJSON country boundary detection
- Hover highlight and country tooltip
- Click Earth to auto-fill country or region
- Postcard-style memory form
- Three memory types: want to go, already wished/visited, dream list
- Photo upload
- Stars appear on the globe after saving
- Envelope animation flies into the mailbox
- Mailbox unread count
- CSS 3D scrapbook page flip
- Edit current memory
- Delete current memory
- Clear all memories
- Browser localStorage persistence

## Run Locally

```powershell
& 'C:\Program Files\nodejs\node.exe' server.js
```

Open:

```text
http://localhost:8766/index.html
```

## GitHub Pages

This project can be published with GitHub Pages. The memory data is stored in each visitor's browser and is not uploaded to GitHub.

Three.js and map/texture assets currently load from online CDNs, so the published page needs internet access.
