import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import Navbar from "./components/Navbar.jsx";

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Navbar />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<DashboardPage />} />
            <Route path="/quiz/create" element={<CreateQuizPage />} />
            <Route path="/quiz/:quizId/edit" element={<EditQuizPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/session/:sessionId/waiting" element={<WaitingRoomPage />} />
            <Route path="/session/:sessionId/live" element={<LiveQuizPage />} />
            <Route path="/session/:sessionId/host" element={<HostControlPage />} />
            <Route path="/session/:sessionId/results" element={<ResultsPage />} />
            <Route path="/session/:sessionId/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
