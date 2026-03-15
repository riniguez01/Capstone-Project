import { Routes, Route } from "react-router-dom"
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import Questionnaire from './pages/Questionnaire'
import Matching from './pages/Matching'
import MatchingWithBackend from './pages/MatchingWithBackend'
import Chat from './pages/Chat'
import DatePlanner from './pages/DatePlanner'
import PostDateSurvey from "./components/PostDateSurvey";
import Preferences from "./pages/Preferences";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/matching" element={<MatchingWithBackend />} />  {/* Cindy: swapped to live backend */}
            <Route path="/matching-mock" element={<Matching />} />         {/* Alex's original — kept for reference */}
            <Route path="/chat" element={<Chat />} />
            <Route path="/dates" element={<DatePlanner />} />
            <Route path="/postDate" element={<PostDateSurvey/>} />
        </Routes>
    )
}

export default App
