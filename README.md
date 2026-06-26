# BigQuery Release Notes Dashboard & X/Twitter Composer

A modern, responsive web application built with **Python Flask** on the backend and **vanilla HTML5, CSS3, and JavaScript** on the frontend. The dashboard fetches, parses, and segments the official Google Cloud BigQuery release notes Atom feed, allowing users to search, filter, and draft character-limit-safe updates directly to X (formerly Twitter).

---

## ✨ Features

- **Granular Update Segmentation**: Splits aggregate daily releases (which often group several updates under one date) into individual, category-coded cards (e.g., *Feature*, *Change*, *Announcement*, *Breaking*, *Issue*).
- **Interactive Tweet Composer**: Auto-generates ready-to-share tweet templates with smart character-limit calculations (maximum 280 characters), automatically truncating descriptions to preserve hashtags and source links.
- **Dynamic Limit Meter**: Includes a visual SVG progress ring indicator that turns yellow and red as character thresholds are met.
- **Instant Search & Filter Chips**: Sidebar counts calculate total updates in real-time, allowing users to filter categories instantly or execute instant text searches.
- **Robust macOS SSL Bypass**: Fixes common macOS Python certificate trust issues when querying Google's APIs.
- **Beautiful Dark Theme**: A modern dashboard design complete with card hover effects, smooth transitions, and glassmorphism.

---

## 🏗️ Project Structure

- `app.py` — Flask backend application. Fetches XML feed data, parses it using `ElementTree` and regular expressions, and exposes the `/api/releases` endpoint.
- `templates/index.html` — The dashboard layout container and Twitter composer.
- `static/css/style.css` — Custom stylesheet implementing design tokens, custom counters, layout grids, and animations.
- `static/js/app.js` — Client-side app management, state syncing, search bar filters, and composer calculations.
- `.gitignore` — Excludes virtual environments, cache, editor configs, and OS metadata files.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have Python 3.8+ installed on your computer.

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/maraffi881/maffe-event-talks-app.git
   cd maffe-event-talks-app
   ```

2. **Set up a virtual environment**:
   ```bash
   python3 -m venv .venv
   ```

3. **Activate the virtual environment**:
   - macOS / Linux:
     ```bash
     source .venv/bin/activate
     ```
   - Windows:
     ```cmd
     .venv\Scripts\activate
     ```

4. **Install Flask**:
   ```bash
   pip install flask
   ```

### Running Locally

To start the Flask development server, run:
```bash
python app.py
```

By default, the server runs on port `5050` to avoid conflicts on macOS. Open your web browser and navigate to:
👉 **[http://127.0.0.1:5050](http://127.0.0.1:5050)**
