Frontend-clean

Simple static frontend. Serve the folder (or open `index.html`) while backend-clean runs on `http://localhost:3002`.

Example (macOS):

```bash
# from this folder
python3 -m http.server 5000
# open http://localhost:5000
```

If serving from a different origin, set `window.API_BASE = 'https://your-backend-host'` before the script.
