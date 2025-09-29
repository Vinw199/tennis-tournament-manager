# Tournament Management Page

## Purpose

This page provides an administrative interface for managing a live tournament. It allows an admin to enter scores for group stage matches, view standings, and generate the knockout bracket (semi-finals and final).

---

## Architecture

This feature uses a hybrid **Server/Client Component architecture** to optimize for both performance and interactivity.

1.  **Server Component (`page.jsx`)**: Handles the fast, initial, one-time data fetch for the entire tournament. This ensures a quick page load.
2.  **Client Component (`ManageTournamentClient.jsx`)**: Receives the initial data and is responsible for rendering all UI and handling user interactions.
3.  **Custom Hook (`useTournamentManager.js`)**: Contains all the complex business logic, state management, and functions. It keeps the Client Component clean and focused on presentation.

---

## Key Files

-   **`page.jsx`**: A Server Component that fetches the tournament, entries, and matches. It passes this data as `initialData` to the client component.
-   **`ManageTournamentClient.jsx`**: A Client Component that consumes the `useTournamentManager` hook and renders the entire UI for the page.
-   **`hooks/useTournamentManager.js`**: A custom hook that accepts `initialData` and manages all state, derived data (standings, brackets), and actions (saving scores, generating knockouts).

---

## Data Flow

1.  A user navigates to the page.
2.  The Server Component (`page.jsx`) fetches all required data from Supabase.
3.  The fetched data is passed as a prop (`initialData`) to the `ManageTournamentClient.jsx` component.
4.  The `ManageTournamentClient` calls the `useTournamentManager` hook, passing `initialData` to it.
5.  The hook initializes its state with this server-fetched data and then manages all subsequent user interactions and state changes on the client side.