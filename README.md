# Deeper Research Synthetic - Build Guide

## Overview
This repository contains the implementation of the **Deeper Research Synthetic** ecosystem, an agentic tool for generating high-quality, framework-based analysis.

## Architecture
- **Frontend**: React (Vite)
- **Backend**: Node.js (Express)
- **Database**: LanceDB (Embedded Vector Database)
- **AI**: Gemini API (with Mock Fallback)

## Prerequisites
- Node.js (v18+)
- npm

## Quick Start
To start the entire application (Backend + Frontend) in development mode:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Application**:
    ```bash
    npm start
    ```

    - Backend runs on: `http://localhost:3001`
    - Frontend runs on: `http://localhost:5173`

3.  **Access the App**:
    Open your browser to `http://localhost:5173`.

## Configuration
- **Gemini API Key**: To use the real Gemini API, create a `.env` file in `backend/` and add:
  ```
  GEMINI_API_KEY=your_api_key_here
  ```
  If no key is provided, the system defaults to a **Synthetic Mock Generator** for testing purposes.

## Key Features
- **Project Management**: Create projects with specific frameworks (Deepdive, Synthetic, Benchmark).
- **Source Context**: Input raw data/text which is vectorized and stored in LanceDB.
- **AI Generation**: Generate structured analysis based on context and framework.
- **Vector Search**: (Backend) Context is embedded using a 384-dimensional model (placeholder or Xenova/transformers).

## Project Structure
- `backend/`: Server logic, API endpoints, LanceDB data (`backend/data`).
- `frontend/`: React application components and layouts.
- `Project-phased-build-contract.md`: Development roadmap and status.
