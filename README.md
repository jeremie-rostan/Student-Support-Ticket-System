# Student Support Ticket System

A comprehensive Next.js application for tracking and managing student support tickets with AI-powered analysis, voice transcription, and pattern recognition.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Core Functionality
- ✅ **Create and manage student support tickets** with multiple students per ticket
- 📊 **Categorize tickets** (Academic, Behavioral, SEL, or custom categories)
- 🔄 **Track ticket status** (New, In Progress, Resolved)
- 📝 **Add conversation notes** to document interactions and progress
- 👥 **Student profiles** showing all tickets and patterns for individual students

### AI-Powered Features
- 🤖 **AI Assistant** powered by LM Studio for:
  - Analyzing student behavior patterns
  - Generating comprehensive reports
  - Identifying students who need attention
  - Answering questions about tickets and trends
- 💬 **Markdown rendering** for AI responses with proper formatting
- 📈 **Pattern recognition** across students and ticket categories
- 🔍 **Quick action buttons** for common queries

### Voice & Transcription
- 🎙️ **Voice recording** with browser-based speech recognition
- 🗣️ **AssemblyAI integration** for speaker diarization
- 📋 **Automatic summarization** of recorded conversations
- 🎤 **Multiple transcription sources** (browser-based and cloud-based)

### User Experience
- 🎨 **Modern, responsive UI** built with shadcn/ui components
- 🌓 **Dark mode support** with automatic theme detection
- 📱 **Mobile-friendly** design
- 💾 **Local data persistence** with automatic saving
- 🔍 **Expandable chat interface** for better readability of long AI responses

## Tech Stack

- **Framework:** Next.js 16.1.1 with App Router
- **UI Library:** React 19.2.3
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **AI/ML:**
  - Web Speech API (browser-based speech-to-text)
  - AssemblyAI (cloud transcription with speaker detection)
  - LM Studio (local LLM integration)
- **Utilities:**
  - date-fns (date formatting)
  - react-markdown (markdown rendering)
  - lucide-react (icons)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- LM Studio (for AI assistant features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jeremie-rostan/Student-Support-Ticket-System.git
cd Student-Support-Ticket-System
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Optional: LM Studio Setup

For AI assistant functionality:

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Load a compatible model (e.g., Llama 3.2 3B)
3. Start the local server on `localhost:1234`
4. The AI Assistant will automatically connect

### Optional: AssemblyAI Setup

For advanced transcription with speaker diarization:

1. Get an API key from [AssemblyAI](https://www.assemblyai.com/)
2. Open Settings in the app
3. Enter your AssemblyAI API key
4. Use the "Voice Note" feature with speaker detection enabled

## Usage

### Creating a Ticket

1. Click **"Add Ticket"** button
2. Fill in the details:
   - Date of incident
   - Select student(s) involved
   - Choose category
   - Set status
   - Add description
3. Click **"Save"**

### Adding Notes to a Ticket

1. Open an existing ticket
2. Click **"Add Note"**
3. Choose between:
   - **Text Note:** Type directly
   - **Voice Note:** Record and automatically transcribe
4. Notes support:
   - Manual text entry
   - Browser-based voice recording (Web Speech API)
   - AssemblyAI transcription with speaker detection

### Using the AI Assistant

1. Toggle the **"AI Assistant"** in the header
2. Ask questions about students, tickets, or patterns:
   - "What are John's main issues?"
   - "Which students have the most tickets?"
   - "Generate a report of all behavioral tickets"
3. Use quick action buttons for common queries
4. Click the **expand icon** to view responses in full-screen mode

### Managing Students

1. Switch to **"Students"** view
2. See all students with ticket counts
3. Click on a student to view their profile
4. Add tickets directly from student profiles

## Data Storage

All data is stored locally in JSON files in the `data/` directory:
- `tickets.json` - All ticket and student data
- Data persists between sessions
- Automatic backups on save

## Project Structure

```
student-incidents/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── chat/          # AI chat endpoint
│   │   ├── tickets/       # Ticket data API
│   │   └── transcribe-assembly/ # AssemblyAI integration
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ai/               # AI assistant components
│   ├── incidents/        # Ticket management components
│   ├── settings/         # Settings dialog
│   └── ui/               # Reusable UI components
├── contexts/             # React contexts
│   └── IncidentsContext.tsx # Global state management
├── hooks/                # Custom React hooks
│   ├── useSpeechRecognition.ts # Web Speech API integration
│   └── useTickets.ts     # Ticket management hook
├── lib/                  # Utility functions
│   ├── dateUtils.ts      # Date handling
│   ├── lm-studio.ts      # LM Studio integration
│   └── utils.ts          # General utilities
├── types/                # TypeScript type definitions
│   └── index.ts
└── data/                 # Local data storage
    └── tickets.json
```

## Configuration

### Settings Dialog

Access via the Settings icon in the header:
- **Theme:** Light/Dark mode toggle
- **LM Studio Model:** Select your preferred model
- **AssemblyAI Key:** Configure cloud transcription

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

## Features in Detail

### AI Assistant Capabilities

The AI assistant can help you:
- Generate comprehensive reports with statistics
- Identify behavioral patterns
- Highlight students needing attention
- Answer specific questions about tickets
- Track trends over time

### Voice Recording Options

**Browser-based (Web Speech API):**
- Works offline
- Fast processing
- Good for quick notes
- Uses browser's native speech recognition

**AssemblyAI:**
- Cloud-based processing
- Speaker diarization (identifies who said what)
- Higher accuracy
- Automatic summarization
- Requires API key

### Expandable Chat Interface

Click the expand icon in the AI Assistant to:
- View responses in full-screen (95% viewport)
- Better readability for long reports
- Enhanced markdown rendering
- Easy minimize back to sidebar

## Browser Compatibility

- Chrome/Edge: Full support (recommended)
- Firefox: Full support
- Safari: Limited voice recording support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [LM Studio](https://lmstudio.ai/)
- Transcription by [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) and [AssemblyAI](https://www.assemblyai.com/)
- Icons by [Lucide](https://lucide.dev/)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
