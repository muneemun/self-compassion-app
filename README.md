# Relation-Temp Rx (관계온도 Rx) - App Foundation

This is the foundational codebase for the Relation-Temp Rx mobile application, built with Expo.

## 🚀 Getting Started

Due to some local environment permission issues, you may need to install dependencies manually.

1. **Install Dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run the App**:
   ```bash
   npx expo start
   ```

## 🏗️ Core Architecture

- **`src/theme/ColorLockContext.tsx`**: Enforces the 3-color palette across the app.
- **`src/layouts/BaseLayout.tsx`**: Provides standardized layouts for Hub, Detail, and Task profiles.
- **`src/components/AppHeader.tsx`**: Unified header system.
- **`src/store/useAppStore.ts`**: Global state management using Zustand.

Built with "Warm Minimalism" and "Color Lock" principles.
