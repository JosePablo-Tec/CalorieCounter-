# GEMINI.md

## Project Overview

This is a web application for tracking daily calorie intake. It's built with React, Vite, and TypeScript. The application allows users to add food items with their calorie counts, set a daily calorie goal, and view their progress. It also includes features for managing meal templates and viewing historical data. The project integrates with the Gemini API to provide AI-powered features, likely for food suggestions or analysis.

## Building and Running

To build and run this project locally, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:**
    Create a `.env.local` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

4.  **Build for Production:**
    ```bash
    npm run build
    ```

5.  **Preview the Production Build:**
    ```bash
    npm run preview
    ```

## Development Conventions

*   **Component-Based Architecture:** The application follows a component-based architecture, with components located in the `src/components` directory.
*   **Styling:** The project uses a utility-first CSS framework (likely Tailwind CSS, given the class names in `App.tsx`).
*   **State Management:** The application uses React's built-in state management (`useState`, `useMemo`).
*   **TypeScript:** The project is written in TypeScript, and type definitions are located in `src/types.ts`.
*   **Vite:** The project uses Vite as a build tool, and the configuration is in `vite.config.ts`.
