# Mission Control - AIM Agent Dashboard

A beautiful Kanban-style task management dashboard built for Aaron's AIM operations.

![Mission Control](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## Features

- 🎯 **Kanban Board** - 5-column workflow (Inbox → Up Next → In Progress → In Review → Done)
- 🖱️ **Drag & Drop** - Smooth task movement between columns using dnd-kit
- ⚡ **Live Activity** - Real-time activity feed showing all task changes
- 🎨 **Aaron's Branding** - Magenta (#E91E8C) and Cyan (#00D9FF) accent colors
- 🌙 **Dark Theme** - Deep dark background (#0A0A0F) that's easy on the eyes
- 📱 **Responsive** - Works on desktop and tablet
- 🚀 **Fast** - SQLite for instant local storage

## Quick Start

```bash
# Navigate to the project
cd mission-control

# Install dependencies (if not done)
npm install

# Run development server
npm run dev

# Open in browser
open http://localhost:3000
```

## Tech Stack

- **Next.js 16** - App Router with Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **dnd-kit** - Drag and drop functionality
- **better-sqlite3** - Fast local SQLite database
- **Lucide Icons** - Clean icon set

## Project Structure

```
mission-control/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main dashboard
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Theme + custom styles
│   │   └── api/              # API routes
│   │       ├── tasks/        # Task CRUD
│   │       └── activity/     # Activity feed
│   ├── components/
│   │   ├── KanbanBoard.tsx   # Main board with DnD
│   │   ├── KanbanColumn.tsx  # Individual column
│   │   ├── TaskCard.tsx      # Draggable task card
│   │   ├── TaskModal.tsx     # Create/edit modal
│   │   ├── LiveActivity.tsx  # Activity panel
│   │   └── Header.tsx        # Top navigation
│   └── lib/
│       ├── db.ts             # SQLite database
│       ├── types.ts          # TypeScript types
│       └── utils.ts          # Utilities
└── data/
    └── mission-control.db    # SQLite database (auto-created)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get single task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/activity` | Get activity feed |

## Color Palette

```css
/* Aaron's Brand Colors */
--magenta: #E91E8C;    /* Primary accent */
--cyan: #00D9FF;       /* Secondary accent */

/* Dark Theme */
--background: #0A0A0F;  /* Main background */
--card: #12121A;        /* Card backgrounds */
--border: #2A2A3E;      /* Borders */

/* Status Colors */
--success: #34D399;     /* Done, Online */
--warning: #FBBF24;     /* In Review */
--error: #F87171;       /* Urgent, Destructive */
```

## Future Enhancements

- [ ] WebSocket real-time updates
- [ ] OpenClaw gateway integration
- [ ] Sub-agent monitoring
- [ ] Cron job calendar
- [ ] Global search
- [ ] Mission grouping
- [ ] Mobile app

---

Built with ⚡ for AIM Live
