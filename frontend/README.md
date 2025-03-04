# Frontend App

## Instructions to Run and Use the App

### Prerequisites
- Node.js installed (preferably v20)
- npm installed (preferably v10.8 or more)

### Installation
1. Navigate to the frontend directory:
    ```sh
    cd frontend
    ```
2. Install the dependencies:
    ```sh
    npm install
    ```

### Running the App
1. To start the development server, run:
    ```sh
    npm run dev
    ```
    This will:
    - Build and watch CSS files using Tailwind CSS
    - Build and watch TypeScript files using esbuild
    - Start the HTTP server on port 3000

2. Open your browser and navigate to:
    ```
    http://localhost:3000
    ```

### Building the App
- To build the CSS files:
  ```sh
  npm run build:css
  ```
- To build the TypeScript files:
  ```sh
  npm run build:ts
  ```

### Starting the Server
- To start the HTTP server only:
  ```sh
  npm run start
  ```
  