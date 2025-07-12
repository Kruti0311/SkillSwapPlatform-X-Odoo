import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import axios from "axios";
import "./Navbar.css";

const Navbar = () => {
  const { user, setUser } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const { data } = await axios.get('/platform-message/unread-count');
          setUnreadCount(data.data.unreadCount);
        } catch (err) {
          setUnreadCount(0);
        }
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    localStorage.removeItem("userInfo");
    setUser(null);
    try {
      await axios.get("/auth/logout");
      window.location.href = "/login";
    } catch (error) {
      window.location.href = "/login";
    }
  };

  return (
    <nav className="custom-navbar">
      <div className="navbar-logo" onClick={() => navigate("/")}>SkillSwap</div>
      <div className="navbar-links">
        <NavLinkItem to="/" label="Home" />
        {user && <NavLinkItem to="/discover" label="Discover" />}
        {user && <NavLinkItem to="/chats" label="Your Chats" />}
        {user && (
          <NavLinkItem to="/platform-messages" label="Platform Messages" badge={unreadCount} />
        )}
      </div>
      <div className="navbar-actions">
        {!user ? (
          <>
            <Link to="/login" className="nav-btn login">Log In</Link>
            <Link to="/register" className="nav-btn cta">Get Started</Link>
          </>
        ) : (
          <div className="profile-dropdown-wrapper">
            <div
              className="profile-avatar"
              onClick={() => setProfileOpen((open) => !open)}
              tabIndex={0}
              onBlur={() => setTimeout(() => setProfileOpen(false), 200)}
            >
              <img src={user.picture} alt="avatar" />
              <span className="profile-name">{user.name.split(" ")[0]}</span>
              <span className="profile-caret">▼</span>
            </div>
            {profileOpen && (
              <div className="profile-dropdown animated-fade-in">
                <div className="dropdown-item" onClick={() => navigate(`/profile/${user.username}`)}>
                  Profile
                </div>
                <div className="dropdown-item" onClick={handleLogout}>
                  Logout
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLinkItem = ({ to, label, badge }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className={`nav-link-item ${isActive ? 'active' : ''}`}>
      <span className="nav-link-label">{label}</span>
      {badge > 0 && (
        <span className="nav-badge">{badge > 9 ? "9+" : badge}</span>
      )}
    </Link>
  );
};

export default Navbar;
