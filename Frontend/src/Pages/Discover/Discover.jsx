import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import axios from "axios";
import { toast } from "react-toastify";
import ProfileCard from "./ProfileCard";
import "./Discover.css";
import { motion, AnimatePresence } from "framer-motion";
import Spinner from "react-bootstrap/Spinner";

const TABS = [
  { key: "forYou", label: "For You" },
  { key: "webDev", label: "Web Development" },
  { key: "ml", label: "Machine Learning" },
  { key: "others", label: "Others" },
];

const Discover = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [webDevUsers, setWebDevUsers] = useState([]);
  const [mlUsers, setMlUsers] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("forYou");

  // Helper function to filter users by skill
  const filterBySkill = (users) => {
    if (!searchQuery.trim()) return users;
    return users.filter((user) =>
      user.skillsProficientAt &&
      user.skillsProficientAt.some((skill) =>
        skill.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    );
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/user/registered/getDetails`);
        setUser(data.data);
        localStorage.setItem("userInfo", JSON.stringify(data.data));
      } catch (error) {
        localStorage.removeItem("userInfo");
        setUser(null);
        await axios.get("/auth/logout");
        navigate("/login");
      }
    };
    const getDiscoverUsers = async () => {
      try {
        const { data } = await axios.get("/user/discover");
        setDiscoverUsers(data.data.forYou);
        setWebDevUsers(data.data.webDev);
        setMlUsers(data.data.ml);
        setOtherUsers(data.data.others);
      } catch (error) {
        localStorage.removeItem("userInfo");
        setUser(null);
        await axios.get("/auth/logout");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    getUser();
    getDiscoverUsers();
  }, []);

  const getTabUsers = () => {
    switch (activeTab) {
      case "forYou":
        return filterBySkill(discoverUsers);
      case "webDev":
        return filterBySkill(webDevUsers);
      case "ml":
        return filterBySkill(mlUsers);
      case "others":
        return filterBySkill(otherUsers);
      default:
        return [];
    }
  };

  return (
    <div className="discover-modern-bg">
      <div className="discover-container">
        <motion.div
          className="discover-hero-glow"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
        />
        <div className="discover-header">
          <h1 className="discover-title">Discover Amazing People & Skills</h1>
          <motion.input
            className="discover-search-bar"
            type="text"
            placeholder="Search by skill (e.g., Photoshop, Excel)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            whileFocus={{ boxShadow: "0 0 0 3px #00e6ff55" }}
          />
          <div className="discover-tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`discover-tab-btn${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    className="tab-underline"
                    layoutId="tab-underline"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="discover-cards-section">
          {loading ? (
            <div className="discover-spinner">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + searchQuery}
                className="discover-cards-grid"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
              >
                {getTabUsers().length > 0 ? (
                  getTabUsers().map((user) => (
                    <motion.div
                      key={user._id || user.username}
                      whileHover={{ scale: 1.04, boxShadow: "0 8px 32px #00e6ff33" }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <ProfileCard
                        profileImageUrl={user?.picture}
                        name={user?.name}
                        rating={user?.rating ? user?.rating : 5}
                        bio={user?.bio}
                        skills={user?.skillsProficientAt}
                        username={user?.username}
                        visibility={user?.visibility}
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.h2 style={{ color: "#fbf1a4", textAlign: "center", marginTop: "2rem" }}>
                    No users to show
                  </motion.h2>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
      {/* Animated floating particles */}
      <div className="discover-animated-particles">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="discover-particle"
            animate={{
              y: [0, Math.random() * 60 + 40, 0],
              x: [0, Math.random() * 80 - 40, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              repeat: Infinity,
              duration: Math.random() * 7 + 5,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 70 + 10}%`,
              background: i % 2 === 0 ? "#00e6ff" : "#7f5cff",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Discover;
