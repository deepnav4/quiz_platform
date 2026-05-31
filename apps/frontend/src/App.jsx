import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import Navbar from "./components/Navbar.jsx";
import './App.css';

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CreateQuizPage from "./pages/CreateQuizPage.jsx";
import EditQuizPage from "./pages/EditQuizPage.jsx";
import JoinPage from "./pages/JoinPage.jsx";
import WaitingRoomPage from "./pages/WaitingRoomPage.jsx";
import LiveQuizPage from "./pages/LiveQuizPage.jsx";
import HostControlPage from "./pages/HostControlPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";

/* 
  Routes that use the app-level Navbar (not the homepage).
  The HomePage has its own integrated Navbar + Footer.
*/
const APP_ROUTES = [
  "/login", "/signup", "/quiz/create", "/join",
  "/quiz/:quizId/edit",
  "/session/:sessionId/waiting",
  "/session/:sessionId/live",
  "/session/:sessionId/host",
  "/session/:sessionId/results",
  "/session/:sessionId/leaderboard",
];

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="app-content">
        {children}
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Homepage — has its own Navbar + Footer */}
            <Route path="/" element={<HomePage />} />

            {/* Auth pages with app Navbar */}
            <Route path="/login" element={<AppLayout><LoginPage /></AppLayout>} />
            <Route path="/signup" element={<AppLayout><SignupPage /></AppLayout>} />

            {/* Dashboard (authenticated) */}
            <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />

            {/* Quiz management */}
            <Route path="/quiz/create" element={<AppLayout><CreateQuizPage /></AppLayout>} />
            <Route path="/quiz/:quizId/edit" element={<AppLayout><EditQuizPage /></AppLayout>} />

            {/* Session flow */}
            <Route path="/join" element={<AppLayout><JoinPage /></AppLayout>} />
            <Route path="/session/:sessionId/waiting" element={<AppLayout><WaitingRoomPage /></AppLayout>} />
            <Route path="/session/:sessionId/live" element={<AppLayout><LiveQuizPage /></AppLayout>} />
            <Route path="/session/:sessionId/host" element={<AppLayout><HostControlPage /></AppLayout>} />
            <Route path="/session/:sessionId/results" element={<AppLayout><ResultsPage /></AppLayout>} />
            <Route path="/session/:sessionId/leaderboard" element={<AppLayout><LeaderboardPage /></AppLayout>} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
