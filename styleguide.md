# YAFRA Styleguide & Architecture

## 1. Language & Linting

- **TypeScript (Strict):** No `any` types allowed. All component props must be strictly typed via interfaces.
- **Formatting:** Managed by Prettier.
- **Linting:** ESLint v9 (Flat Config) using `@typescript-eslint` strict rules and `eslint-config-expo`.

## 2. Component Architecture

- **Functional Components:** Use React Functional Components exclusively.
- **Co-location:** A component and its `StyleSheet` must live in the same file. Global styles live in `src/constants/theme.js`.
- **Dumb vs. Smart:** Extract UI into "Dumb" components (e.g., `RestaurantCard.tsx`, `ViewToggle.tsx`) that only receive props. Keep state and data fetching in "Smart" screen components.
- **File Splitting:** Split files based on Reusability, Readability (keep < 150 lines), and Single Responsibility.

## 3. Testing Rules

- **Stack:** Jest, `@testing-library/react-native`.
- **Target:** Test behavior and user-facing elements (`getByText`, `getByTestId`), NOT implementation details.
- **Frameworks:** Do not test React Navigation or React Native core behavior.
