import { Outlet, Navigate } from "react-router-dom";

const PrivateRoutes = () => {
  const userInfo = localStorage.getItem("userInfo");
  if (!userInfo) return <Navigate to="/login" />;
  let user;
  try {
    user = JSON.parse(userInfo);
  } catch {
    localStorage.removeItem("userInfo");
    return <Navigate to="/login" />;
  }
  if (user.banned) {
    localStorage.removeItem("userInfo");
    return <Navigate to="/banned" />;
  }
  return <Outlet />;
};

export default PrivateRoutes;
