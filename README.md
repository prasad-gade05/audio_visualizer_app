# Audio Visualizer

This is a web-based audio visualization tool built with React, Vite, and shadcn/ui. It allows users to upload audio files, capture system audio, and visualize the audio in different ways, including a 3D globe and a traditional audio visualizer.

## Features

*   **File Upload:** Upload your own audio files to visualize.
*   **System Audio Capture:** Capture and visualize audio directly from your system's output.
*   **Multiple Visualization Modes:** Switch between different visualization styles.
*   **3D Audio Globe:** A unique 3D visualization of audio data.
*   **Modern UI:** Built with shadcn/ui and Tailwind CSS for a clean and responsive user interface.

## Technologies Used

*   **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
*   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Routing:** [React Router DOM](https://reactrouter.com/)
*   **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
*   **Data Fetching:** [TanStack Query](https://tanstack.com/query/latest)
*   **Linting:** [ESLint](https://eslint.org/)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed on your system.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd your-repo-name
    ```
3.  Install the dependencies:
    ```bash
    pnpm install
    ```

### Running the Application

To start the development server, run the following command:

```bash
pnpm dev
```

This will start the application in development mode. Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## Available Scripts

In the project directory, you can run:

*   `pnpm dev`: Runs the app in the development mode.
*   `pnpm build`: Builds the app for production to the `dist` folder.
*   `pnpm lint`: Lints the source code for errors.
*   `pnpm preview`: Serves the production build locally for preview.

## Project Structure

```
.
├── public/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── AudioControls.tsx
│   │   ├── AudioGlobe3D.tsx
│   │   ├── AudioVisualizer.tsx
│   │   ├── FileUpload.tsx
│   │   └── ...
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   └── types/
├── .gitignore
├── package.json
├── README.md
└── ...
```