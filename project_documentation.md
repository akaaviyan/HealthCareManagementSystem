# Healthcare Appointment Management System
## Detailed Project Documentation

This document serves as a comprehensive guide to understanding the underlying structure, tools, and logic of the Healthcare Appointment Management System frontend application. It is designed to be highly readable for anyone, including junior developers joining the project.

---

## 1. Tools & Technologies Used

* **Vite**: Used as the build tool and development server. It is extremely fast and compiles the React application almost instantly compared to older tools like Create-React-App.
* **ReactJS**: The core UI library used to build all the interactive interfaces using components, state (`useState`), and lifecycle hooks (`useEffect`).
* **React Router DOM**: The standard routing library used to navigate between different pages in the application (like going from `/login` to `/patient/dashboard`) without reloading the entire web page.
* **Bootstrap 5 & React-Bootstrap**: The CSS framework used to make the application beautiful and responsive. `React-Bootstrap` replaces normal Bootstrap Javascript, allowing us to use Bootstrap components as React tags (e.g., `<Card>`, `<Button>`, `<Modal>`).
* **UUID**: A tiny library used strictly to generate unique ID strings (e.g., `u1`, `a1`) whenever a new User or Appointment is created.

---

## 2. Global Component & Directory Structure

The project lives entirely inside the `src` folder. Here is the high-level outline:

```text
src/
├── main.jsx                 (Core entry point)
├── App.jsx                  (Routing engine)
├── index.css                (Global CSS rules, custom Bootstrap themes)
├── components/              (Reusable UI snippets)
│   ├── MainNavbar.jsx
│   └── ProtectedRoute.jsx
├── context/                 (Global State Storage)
│   └── AuthContext.jsx
├── services/                (Data & API simulation layer)
│   └── mockData.js
└── pages/                   (The main screens of our application)
    ├── Home.jsx
    ├── Login.jsx
    ├── Register.jsx
    ├── Profile.jsx
    ├── PatientDashboard.jsx
    ├── BookAppointment.jsx
    ├── DoctorDashboard.jsx
    └── DoctorAvailability.jsx
```

---

## 3. High-Level Core Logic & Linkage

How does the whole app fit together? 
1. `main.jsx` wraps the entire application in a `<BrowserRouter>` (to enable URLs) and an `<AuthProvider>` (to keep track of who is logged in globally).
2. It then renders `<App />` which contains all of our `<Route>` mapping.
3. Depending on the URL (and whether the user is successfully wrapped in a `<ProtectedRoute>`), `App` renders one of the files in the `pages/` folder.
4. Every page and component interacts with the "backend" by calling the utility functions exported from `services/mockData.js`. 

---

## 4. Detailed Component Breakdowns

Below is a detailed explanation of what happens inside every major file in the project.

### `main.jsx` & `App.jsx`
* **How it works:** `main.jsx` is the anchor. `App.jsx` sits exactly inside it, providing the `<MainNavbar />` at the top of everything, followed by a switchboard of `<Routes>`.
* **Linkage:** It links a URL path (like `/login`) to a physical Component file (like `<Login />`). Crucially, the dashboards are wrapped in `<ProtectedRoute>` so unauthenticated users get bounced.

### `context/AuthContext.jsx`
* **How it works:** It acts as a global storage locker that is easily accessible by any component in the app. It holds the `user` state. On first load, it uses an effect hook (`useEffect`) to check if the browser's `localStorage` has a logged-in user. If it does, it silently logs them back in.
* **Linkage:** Provides the `user`, `login()`, `logout()`, and `setUser()` properties globally. `Navbar`, `Login`, and `Profile` listen to this.

### `services/mockData.js`
* **How it works:** Because this app runs without a backend, this file fakes a backend database. It contains arrays of default Users, Appointments, and Availabilities. When the app starts, it pushes this data into the browser's `localStorage` if it's empty. All modifications (creating users, editing profiles, cancelling slots) write directly back to `localStorage`.
* **Linkage:** Inherited everywhere. For example, `PatientDashboard` calls `getAppointmentsByUser()` to read data, and `updateAppointment()` to cancel one.

### `components/MainNavbar.jsx`
* **How it works:** The constant navigation header. It uses the `user` object from `AuthContext` to determine what to show.
   - If User is NULL: Shows "Login" and "Register" buttons.
   - If User is Patient/Doctor: Shows a dummy `<FaUserCircle>` dropdown displaying their name, allowing them to access the Profile page or logout. The Logo link intelligently maps to the Dashboard instead of the Home page if the user is authenticated.

### `components/ProtectedRoute.jsx`
* **How it works:** It acts as a security bouncer. It takes `children` (a component it wraps). It looks at `AuthContext`. If `user === null`, it instantly forces the browser to redirect to `/login` using the `<Navigate>` component. If the user is logged in, it renders the child securely.

### `pages/Home.jsx`
* **How it works:** The public storefront. Contains standard HTML/React-Bootstrap grids explaining the app's features. If a user is magically logged in (e.g. they typed `/` manually in their browser after authenticating), an early check redirects them straight to their respective Dashboard.

### `pages/Login.jsx` & `pages/Register.jsx`
* **How it works:** Both use simple `<Form>` components. They hold an internal `useState` matching what the user types.
* **Action:** When submitted, the `handleSubmit` runs. `Login` executes the `login()` context method, which queries `mockData.js`. If successful, the app detects the `role` and routes them to the dashboard using `useNavigate()`. `Register` creates a new object and saves it via `registerUser()`.

### `pages/Profile.jsx`
* **How it works:** Allows a user to edit personal and medical demographics. Upon mounting (`useEffect`), it reads the global context `user` object and pre-fills the form with data (Age, Weight, Blood Type, Address, etc.). 
* **Action:** Clicking "Save" triggers the `updateUser()` mock API endpoint, which updates both the `localStorage` and tells `AuthContext` to visually adapt.

### `pages/PatientDashboard.jsx`
* **How it works:** When it loads, `useEffect` triggers asking `mockData.js` for all appointments tied to the Patient ID. It maps through them to render a table. The `App Status` badge elegantly changes colors via a simple `switch` helper function.
* **Action (Reschedule/Cancel):** If a user clicks Cancel, the `status` string is swapped to "Cancelled" and the screen reloads. If they click Reschedule, a Bootstrap `<Modal>` pops up. `useEffect` is then told to fetch the specific doctor's time slots for whatever new date the user types in, mapping them as clickable options.

### `pages/BookAppointment.jsx` (Patient Flow)
* **How it works:** Divided into a 3-step dynamic form:
   1. It fetches all Doctors and populates a dropdown.
   2. Only after selecting a doctor does the Date Picker appear.
   3. Once a Date is chosen, it runs `getDoctorAvailability(doctorId, date)` to find available time-slots. If they exist, it renders clickable buttons.
* **Action:** Submitting calls `bookAppointment` and pushes the route to the dashboard.

### `pages/DoctorDashboard.jsx` (Doctor Flow)
* **How it works:** Almost identical to `PatientDashboard`, but tailored for physicians. It reads the appointments associated with the Doctor's own `userId`. 
* **Action:** It contains an "Add Notes" button for upcoming appointments. Clicking it triggers a `<Modal>` containing textareas. Upon submitting, it fires `updateAppointment` pushing real notes and prescriptions to the database, altering the status beautifully to 'Completed'.

### `pages/DoctorAvailability.jsx`
* **How it works:** A small screen for doctors to configure their working hours. The doctor provides a Date string and types comma-separated times (e.g. "09:00 AM, 12:00 PM").
* **Action:** It intercepts the string, splits it by commas into an array, and saves it against the Date in the database format. Because `mockData.js` checks against active appointments, any matching `Booked` patient appointments simply "hide" these created slots automatically in real-time.
