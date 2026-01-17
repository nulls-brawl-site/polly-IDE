import { FileItem } from './types.ts';

export const REACT_DEFAULTS: FileItem[] = [
  {
    id: 'pkg-json',
    name: 'package.json',
    type: 'file',
    path: 'package.json',
    content: JSON.stringify({
      name: "pollinations-react-app",
      version: "0.0.0",
      private: true,
      type: "module",
      scripts: {
        "dev": "vite",
        "build": "tsc && vite build",
        "preview": "vite preview"
      },
      dependencies: {
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "lucide-react": "^0.344.0",
        "framer-motion": "^11.0.8",
        "clsx": "^2.1.0",
        "tailwind-merge": "^2.2.1"
      },
      devDependencies: {
        "@types/react": "^18.2.64",
        "@types/react-dom": "^18.2.21",
        "@vitejs/plugin-react": "^4.2.1",
        "autoprefixer": "^10.4.18",
        "postcss": "^8.4.35",
        "tailwindcss": "^3.4.1",
        "typescript": "^5.2.2",
        "vite": "^5.1.6"
      }
    }, null, 2)
  },
  {
    id: 'vite-config',
    name: 'vite.config.ts',
    type: 'file',
    path: 'vite.config.ts',
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`
  },
  {
    id: 'tailwind-config',
    name: 'tailwind.config.js',
    type: 'file',
    path: 'tailwind.config.js',
    content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
  },
  {
    id: 'postcss-config',
    name: 'postcss.config.js',
    type: 'file',
    path: 'postcss.config.js',
    content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
  },
  {
    id: 'tsconfig',
    name: 'tsconfig.json',
    type: 'file',
    path: 'tsconfig.json',
    content: JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        unusedLocals: true,
        unusedParameters: true,
        fallthroughCasesInSwitch: true
      },
      include: ["src"],
      references: [{ path: "./tsconfig.node.json" }]
    }, null, 2)
  },
   {
    id: 'index-html',
    name: 'index.html',
    type: 'file',
    path: 'index.html',
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pollinations App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>`
  },
  {
      id: 'src-folder', name: 'src', type: 'folder', path: 'src', parentId: null
  },
  {
      id: 'index-tsx', name: 'index.tsx', type: 'file', path: 'src/index.tsx', parentId: 'src-folder',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`
  },
  {
      id: 'app-tsx', name: 'App.tsx', type: 'file', path: 'src/App.tsx', parentId: 'src-folder',
      content: `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Hello World</h1>
        <p className="text-gray-400">Start editing to see some magic happen!</p>
      </div>
    </div>
  );
}

export default App;`
  },
  {
      id: 'index-css', name: 'index.css', type: 'file', path: 'src/index.css', parentId: 'src-folder',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
  }
];

export const ANGULAR_DEFAULTS: FileItem[] = [
    {
    id: 'pkg-json',
    name: 'package.json',
    type: 'file',
    path: 'package.json',
    content: JSON.stringify({
      name: "pollinations-angular-app",
      version: "0.0.0",
      scripts: {
        "ng": "ng",
        "start": "ng serve",
        "build": "ng build",
        "watch": "ng build --watch --configuration development",
        "test": "ng test"
      },
      private: true,
      dependencies: {
        "@angular/animations": "^17.0.0",
        "@angular/common": "^17.0.0",
        "@angular/compiler": "^17.0.0",
        "@angular/core": "^17.0.0",
        "@angular/forms": "^17.0.0",
        "@angular/platform-browser": "^17.0.0",
        "@angular/platform-browser-dynamic": "^17.0.0",
        "@angular/router": "^17.0.0",
        "rxjs": "~7.8.0",
        "tslib": "^2.3.0",
        "zone.js": "~0.14.2"
      },
      devDependencies: {
        "@angular-devkit/build-angular": "^17.0.0",
        "@angular/cli": "^17.0.0",
        "@angular/compiler-cli": "^17.0.0",
        "@types/jasmine": "~5.1.0",
        "jasmine-core": "~5.1.0",
        "karma": "~6.4.0",
        "karma-chrome-launcher": "~3.2.0",
        "karma-coverage": "~2.2.0",
        "karma-jasmine": "~5.1.0",
        "karma-jasmine-html-reporter": "~2.1.0",
        "typescript": "~5.2.2",
        "tailwindcss": "^3.4.1",
        "postcss": "^8.4.35",
        "autoprefixer": "^10.4.18"
      }
    }, null, 2)
  },
  {
      id: 'angular-json', name: 'angular.json', type: 'file', path: 'angular.json',
      content: JSON.stringify({
        "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
        "version": 1,
        "newProjectRoot": "projects",
        "projects": {
            "demo": {
                "projectType": "application",
                "schematics": {},
                "root": "",
                "sourceRoot": "src",
                "prefix": "app",
                "architect": {
                    "build": {
                        "builder": "@angular-devkit/build-angular:browser",
                        "options": {
                            "outputPath": "dist/demo",
                            "index": "src/index.html",
                            "main": "src/main.ts",
                            "polyfills": ["zone.js"],
                            "tsConfig": "tsconfig.app.json",
                            "assets": ["src/favicon.ico", "src/assets"],
                            "styles": ["src/styles.css"],
                            "scripts": []
                        }
                    }
                }
            }
        }
      }, null, 2)
  },
  {
      id: 'tailwind-config', name: 'tailwind.config.js', type: 'file', path: 'tailwind.config.js',
      content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
  },
  {
      id: 'src-folder', name: 'src', type: 'folder', path: 'src', parentId: null
  },
  {
      id: 'main-ts', name: 'main.ts', type: 'file', path: 'src/main.ts', parentId: 'src-folder',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));`
  },
  {
      id: 'app-folder', name: 'app', type: 'folder', path: 'src/app', parentId: 'src-folder'
  },
  {
      id: 'app-config', name: 'app.config.ts', type: 'file', path: 'src/app/app.config.ts', parentId: 'app-folder',
      content: `import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)]
};`
  },
  {
      id: 'app-routes', name: 'app.routes.ts', type: 'file', path: 'src/app/app.routes.ts', parentId: 'app-folder',
      content: `import { Routes } from '@angular/router';

export const routes: Routes = [];`
  },
  {
      id: 'app-component', name: 'app.component.ts', type: 'file', path: 'src/app/app.component.ts', parentId: 'app-folder',
      content: `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: \`
    <div class="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">Hello Angular</h1>
        <p class="text-gray-400">Start editing to see some magic happen!</p>
      </div>
    </div>
  \`
})
export class AppComponent {
  title = 'demo';
}`
  },
  {
      id: 'styles-css', name: 'styles.css', type: 'file', path: 'src/styles.css', parentId: 'src-folder',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
  },
  {
    id: 'index-html',
    name: 'index.html',
    type: 'file',
    path: 'src/index.html',
    content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Angular App</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>`
  }
];