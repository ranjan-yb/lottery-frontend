import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Lottery from "./components/games/Lottery";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/pages/AdminLogin";
import SecondLottery from "./components/games/SecondLottery";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SecondLottery />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
