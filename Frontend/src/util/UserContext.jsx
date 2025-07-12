import React, { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const UserContext = createContext();

const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  // Function to check if user is actually authenticated with backend
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/user/registered/getDetails');
      setUser(response.data.data);
      return true;
    } catch (error) {
      console.log('User not authenticated with backend');
      setUser(null);
      localStorage.removeItem("userInfo");
      return false;
    }
  };

  // Function to logout user
  const logout = async () => {
    try {
      await axios.get('/auth/logout');
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem("userInfo");
      navigate("/login");
    }
  };

  useEffect(() => {
    const handleUrlChange = () => {
      // Your logic to run when there is a change in the URL
      console.log("URL has changed:", window.location.href);
    };
    window.addEventListener("popstate", handleUrlChange);
    
    const initializeAuth = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      if (userInfoString) {
        try {
          const userInfo = JSON.parse(userInfoString);
          setUser(userInfo);
          // Check if user is actually authenticated with backend
          const isAuthenticated = await checkAuthStatus();
          if (!isAuthenticated) {
            const temp = window.location.href.split("/");
            const url = temp.pop();
            if (url !== "about_us" && url !== "#why-skill-swap" && url !== "" && url !== "discover" && url !== "register") {
              navigate("/login");
            }
          }
        } catch (error) {
          console.error("Error parsing userInfo:", error);
          localStorage.removeItem("userInfo");
        }
      } else {
        const temp = window.location.href.split("/");
        const url = temp.pop();
        if (url !== "about_us" && url !== "#why-skill-swap" && url !== "" && url !== "discover" && url !== "register") {
          navigate("/login");
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
    
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, [window.location.href]);

  return <UserContext.Provider value={{ user, setUser, isLoading, checkAuthStatus, logout }}>{children}</UserContext.Provider>;
};

const useUser = () => {
  return useContext(UserContext);
};

export { UserContextProvider, useUser };
