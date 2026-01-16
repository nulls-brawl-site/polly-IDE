
# Pollinations IDE

A mobile-first AI coding environment that generates React and Angular applications in real-time using the Pollinations.ai API.

## ⚡ Features

- **Mobile-First Design**: Optimized for coding on the go.
- **AI Powered**: Uses models like OpenAI GPT-4o, Claude 3.5 Sonnet, and Gemini via Pollinations.ai.
- **Virtual File System**: Create, edit, rename, and delete files/folders virtually.
- **Project Export**: Download your generated project as a ZIP file.
- **Multi-Framework**: Supports generating code for React and Angular.
- **Token Tracking**: Real-time tracking of token usage and "pollen" cost.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: Pollinations.ai (Text Generation)
- **Utilities**: JSZip (Export), UUID

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository or extract the project files.

2. Install dependencies:
   ```bash
   npm install

Start the development server:

code
Bash
download
content_copy
expand_less
npm run dev

Open your browser at http://localhost:5173.

🔑 API Configuration

To use advanced models (like GPT-4 or Claude Opus) and ensure higher rate limits, you need a Pollinations API Key.

Go to the Settings tab (Gear icon).

Enter your API Key.

Select your preferred model.

Note: Some basic models may work without a key depending on current API availability.

📂 Project Structure
code
Text
download
content_copy
expand_less
src/
├── components/    # UI Components (Chat, Editor, File Explorer)
├── services/      # API communication logic
├── App.tsx        # Main application state
└── constants.ts   # System prompts and default settings
📜 License

MIT

code
Code
download
content_copy
expand_less
