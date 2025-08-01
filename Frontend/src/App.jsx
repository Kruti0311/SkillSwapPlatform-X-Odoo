import { Route, Routes } from "react-router-dom";
import Footer from "./Components/Footer/Footer";
import Discover from "./Pages/Discover/Discover";
import Login from "./Pages/Login/Login";
import Header from "./Components/Navbar/Navbar";
import LandingPage from "./Pages/LandingPage/LandingPage";
import AboutUs from "./Pages/AboutUs/AboutUs";
import Chats from "./Pages/Chats/Chats";
import Report from "./Pages/Report/Report";
import Profile from "./Pages/Profile/Profile";
import NotFound from "./Pages/NotFound/NotFound";
import Register from "./Pages/Register/Register";
import Rating from "./Pages/Rating/Rating";
import EditProfile from "./Pages/EditProfile/EditProfile";
import PrivateRoutes from "./util/PrivateRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminDashboard from "./Pages/AdminDashboard";
import PlatformMessages from "./Pages/PlatformMessages/PlatformMessages";

const Banned = () => (
  <div style={{ padding: '4rem', textAlign: 'center' }}>
    <h1 style={{ color: 'red' }}>You have been banned</h1>
    <p>Your account has been banned due to violation of platform policies. If you believe this is a mistake, please contact support.</p>
  </div>
);

const App = () => {
  return (
    <>
      <Header />
      <ToastContainer position="top-right" />
      <Routes>
        <Route element={<PrivateRoutes />}>
          <Route path="/chats" element={<Chats />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/platform-messages" element={<PlatformMessages />} />
        </Route>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about_us" element={<AboutUs />} />
        <Route path="/edit_profile" element={<EditProfile />} />
        <Route path="/report/:username" element={<Report />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/rating/:username" element={<Rating />} />
        <Route path="/banned" element={<Banned />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </>
  );
};

export default App;
