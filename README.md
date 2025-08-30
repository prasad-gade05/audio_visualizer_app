# Audio Visualizer

This is a web-based audio visualizer that allows you to visualize audio from either an uploaded file or your system's audio output in real-time.

## Features

- **File-based Visualization:** Upload your own audio files (MP3, WAV, OGG, M4A) and see them visualized.
- **System Audio Capture:** Capture and visualize any audio playing on your computer, such as music from streaming services, game audio, or video soundtracks.
- **Real-time Visualization:** The visualization reacts instantly to the audio input.
- **Playback Controls:** For file-based audio, you have standard playback controls like play, pause, seek, and volume control.
- **Modern UI:** A sleek and user-friendly interface built with React, shadcn/ui, and Tailwind CSS.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js and pnpm installed on your system.

### Installation

1.  Clone the repo:
    ```sh
    git clone https://github.com/your_username/audio-visualizer.git
    ```
2.  Install the dependencies:
    ```sh
    pnpm install
    ```
3.  Start the development server:
    ```sh
    pnpm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Usage

1.  **File Upload Mode:**
    -   Click on the "File Upload" tab.
    -   Drag and drop an audio file or click to select a file from your computer.
    -   Once the file is loaded, use the playback controls to play, pause, and seek through the audio.
    -   The visualizer will react to the audio in real-time.

2.  **System Audio Mode:**
    -   Click on the "System Audio" tab.
    -   Click the "Start Capture" button. Your browser will ask for permission to capture your screen's audio.
    -   Once you grant permission, any audio playing on your system will be visualized.
    -   To stop the visualization, click the "Stop Capture" button.

## Technologies Used

-   **Frontend:**
    -   [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
    -   [Vite](https://vitejs.dev/) - A fast build tool and development server.
    -   [TypeScript](https://www.typescriptlang.org/) - A typed superset of JavaScript.
    -   [shadcn/ui](https://ui.shadcn.com/) - A collection of re-usable components built with Radix UI and Tailwind CSS.
    -   [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework.
    -   [Zustand](https://github.com/pmndrs/zustand) - A small, fast and scalable bearbones state-management solution.
    -   [React Router](https://reactrouter.com/) - For routing and navigation.
-   **Backend:**
    -   [Supabase](https://supabase.io/) - An open source Firebase alternative.

## Project Structure

```
├── public/           # Static assets
├── src/
│   ├── components/   # UI components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions
│   ├── pages/        # Application pages
│   └── types/        # TypeScript types
├── .gitignore
├── index.html
├── package.json
├── README.md
└── vite.config.ts
```