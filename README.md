# 🤖 AI Browser Control

Control your browser using natural language commands powered by Google Gemini AI!

## ✨ Features

- 🎯 **Natural Language Commands** - Control your browser by simply describing what you want to do
- 🌐 **Browser Automation** - Navigate, click, type, scroll, and more
- 🎨 **Beautiful UI** - Modern glassmorphism design with smooth animations
- 📊 **Real-time Status** - See browser status and current URL
- 📝 **Command History** - Track all your commands and their results
- 🤖 **AI-Powered** - Uses Google Gemini to interpret your commands

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Google Chrome installed
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Set up the Backend**

```bash
cd backend
npm install
```

2. **Create `.env` file in backend folder**

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

3. **Set up the Frontend**

```bash
cd ../frontend
npm install
```

### Running the Application

1. **Start the Backend Server** (in `backend` folder)

```bash
npm start
```

2. **Start the Frontend** (in `frontend` folder, new terminal)

```bash
npm run dev
```

3. **Open your browser** and go to `http://localhost:5173`

## 🎮 How to Use

1. **Launch Browser** - Click the "Launch Browser" button
2. **Send Commands** - Type natural language commands like:
   - "Go to YouTube"
   - "Search for AI tutorials"
   - "Click the first video"
   - "Scroll down"
   - "Take a screenshot"
3. **Watch the Magic** - The AI interprets your command and controls the browser!

## 📋 Example Commands

- `Go to Google and search for "AI news"`
- `Navigate to YouTube`
- `Click the search button`
- `Type "machine learning" in the search box`
- `Scroll down the page`
- `Take a screenshot`

## 🛠️ Tech Stack

### Backend
- **Express.js** - Web server
- **Puppeteer** - Browser automation
- **Google Gemini AI** - Natural language processing
- **Chrome Launcher** - Chrome browser management

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **Lucide React** - Icons

## 🔧 Configuration

### Backend Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key (required)
- `PORT` - Server port (default: 3001)

## 📝 API Endpoints

- `POST /api/launch` - Launch the browser
- `POST /api/close` - Close the browser
- `POST /api/command` - Send a command to execute
- `GET /api/status` - Get browser status

## 🎨 Design Features

- **Glassmorphism** - Modern glass-like UI elements
- **Dark Theme** - Easy on the eyes
- **Smooth Animations** - Powered by Framer Motion
- **Responsive** - Works on all screen sizes
- **Real-time Updates** - Status updates every 3 seconds

## 🐛 Troubleshooting

**Browser won't launch?**
- Make sure Google Chrome is installed
- Check if port 9222 is available
- Try restarting the backend server

**Commands not working?**
- Verify your Gemini API key is correct
- Check the browser is launched
- Look at the command history for error messages

**Frontend can't connect to backend?**
- Make sure backend is running on port 3001
- Check for CORS issues in browser console

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Made with ❤️ using AI
