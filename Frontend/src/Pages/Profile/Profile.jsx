import React from "react";
import "./Profile.css";
import Box from "./Box";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import { toast } from "react-toastify";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, setUser } = useUser();
  const [profileUser, setProfileUser] = useState(null);
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/user/registered/getDetails/${username}`);
        console.log("Profile Data:", data.data);
        console.log("Profile User ID:", data.data._id);
        setProfileUser(data.data);
      } catch (error) {
        console.log(error);
        if (error?.response?.data?.message) {
          toast.error(error.response.data.message);
          if (error.response.data.message === "Please Login") {
            localStorage.removeItem("userInfo");
            setUser(null);
            await axios.get("/auth/logout");
            navigate("/login");
          }
        }
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const convertDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const formattedDate = date.toLocaleDateString("en-US", { month: "2-digit", year: "numeric" }).replace("/", "-");
    return formattedDate;
  };

  const connectHandler = async () => {
    console.log("Connect");
    console.log("Profile User:", profileUser);
    console.log("Profile User ID:", profileUser?._id);

    if (!profileUser || !profileUser._id) {
      toast.error("Cannot connect to this profile. Please try refreshing the page.");
      return;
    }

    try {
      setConnectLoading(true);
      const { data } = await axios.post(`/request/create`, {
        receiverID: profileUser._id, // Use _id to identify the receiver
      });

      console.log(data);
      toast.success(data.message);
      setProfileUser((prevState) => {
        return {
          ...prevState,
          status: "Pending",
        };
      });
    } catch (error) {
      console.log(error);
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
        if (error.response.data.message === "Please Login") {
          localStorage.removeItem("userInfo");
          setUser(null);
          await axios.get("/auth/logout");
          navigate("/login");
        }
      }
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="container" style={{ minHeight: "86vh" }}>
        {loading ? (
          <div className="row d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            <div className="profile-box">
              <div className="left-div">
                {/* Profile Photo */}
                <div className="profile-photo">
                  <img src={profileUser?.picture} alt="Profile" />
                </div>
                {/* Name */}
                <div className="misc">
                  <h1 className="profile-name" style={{ marginLeft: "2rem" }}>
                    {profileUser?.name}
                    {profileUser?.visibility === "private" && (
                      <span
                        style={{
                          marginLeft: "10px",
                          fontSize: "0.6em",
                          color: "#999",
                          fontWeight: "normal",
                        }}
                      >
                        🔒 Private Profile
                      </span>
                    )}
                  </h1>
                  {/* Rating */}
                  <div className="rating" style={{ marginLeft: "2rem" }}>
                    {/* Rating stars */}
                    <span className="rating-stars">
                      {profileUser?.rating
                        ? Array.from({ length: profileUser.rating }, (_, index) => <span key={index}>⭐</span>)
                        : "⭐⭐⭐⭐⭐"}
                    </span>
                    {/* Rating out of 5 */}
                    <span className="rating-value">{profileUser?.rating ? profileUser?.rating : "5"}</span>
                  </div>
                  <button
                    className="connect-button"
                    onClick={profileUser?.status === "Connect" ? connectHandler : undefined}
                    disabled={connectLoading}
                    title={
                      profileUser?.visibility === "private" && profileUser?.status === "Connect"
                        ? "Send connection request to private profile"
                        : ""
                    }
                  >
                    {connectLoading ? (
                      <>
                        <Spinner animation="border" variant="light" size="sm" style={{ marginRight: "0.5rem" }} />
                      </>
                    ) : (
                      profileUser?.status
                    )}
                  </button>
                </div>
              </div>
              <div className="edit-links">
                {user.username === username && (
                  <Link to="/edit_profile">
                    <button className="edit-button">Edit Profile ✎</button>
                  </Link>
                )}

                {/* Portfolio Links */}
                <div className="portfolio-links">
                  <a
                    href={profileUser?.githubLink ? profileUser.githubLink : "#"}
                    target={profileUser?.githubLink ? "_blank" : "_self"}
                    className="portfolio-link"
                  >
                    <img src="/assets/images/github.png" className="link" alt="Github" />
                  </a>
                  <a
                    href={profileUser?.linkedinLink ? profileUser.linkedinLink : "#"}
                    target={profileUser?.linkedinLink ? "_blank" : "_self"}
                    className="portfolio-link"
                  >
                    <img src="/assets/images/linkedin.png" className="link" alt="LinkedIn" />
                  </a>
                  <a
                    href={profileUser?.portfolioLink ? profileUser.portfolioLink : "#"}
                    target={profileUser?.portfolioLink ? "_blank" : "_self"}
                    className="portfolio-link"
                  >
                    <img src="/assets/images/link.png" className="link" alt="Portfolio" />
                  </a>
                </div>
              </div>
            </div>

            {/* Bio */}
            <h2>Bio</h2>
            <p className="bio">{profileUser?.bio}</p>
            {(profileUser?.availability && profileUser.availability.length > 0) && (
              <div style={{ margin: '1rem 0', color: '#3BB4A1', fontWeight: 500 }}>
                <strong>Availability:</strong> {profileUser.availability.join(', ')}
              </div>
            )}
            {(profileUser?.customTimeSlots && profileUser.customTimeSlots.length > 0) && (
              <div style={{ margin: '0.5rem 0 1rem 0', color: '#3BB4A1', fontWeight: 500 }}>
                <strong>Custom Time Slots:</strong> {profileUser.customTimeSlots.map(slot => `${slot.from}–${slot.to}`).join(', ')}
              </div>
            )}
            {profileUser?.visibility === "private" && profileUser?.bio === "This profile is private" && (
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "15px",
                  borderRadius: "5px",
                  marginBottom: "20px",
                  border: "1px solid #dee2e6",
                }}
              >
                <p style={{ margin: 0, color: "#6c757d" }}>
                  <strong>🔒 Private Profile:</strong> This profile is private. Send a connection request to see more
                  information.
                </p>
              </div>
            )}

            {/* Skills */}
            <div className="skills">
              <h2>Skills Proficient At</h2>
              {/* Render skill boxes here */}
              <div className="skill-boxes">
                {profileUser?.skillsProficientAt && profileUser?.skillsProficientAt.length > 0 ? (
                  profileUser?.skillsProficientAt.map((skill, index) => (
                    <div className="skill-box" style={{ fontSize: "16px" }} key={index}>
                      {skill}
                    </div>
                  ))
                ) : profileUser?.visibility === "private" && profileUser?.bio === "This profile is private" ? (
                  <div style={{ color: "#6c757d", fontStyle: "italic" }}>
                    Skills information is private. Connect to view skills.
                  </div>
                ) : (
                  <div style={{ color: "#6c757d", fontStyle: "italic" }}>No skills listed yet.</div>
                )}
              </div>
            </div>

            {/* Education */}
            <div className="education">
              <h2>Education</h2>

              <div className="education-boxes">
                {/* Render education boxes here */}
                {profileUser && profileUser?.education && profileUser?.education.length > 0 ? (
                  profileUser?.education.map((edu, index) => (
                    <Box
                      key={index}
                      head={edu?.institution}
                      date={convertDate(edu?.startDate) + " - " + convertDate(edu?.endDate)}
                      spec={edu?.degree}
                      desc={edu?.description}
                      score={edu?.score}
                    />
                  ))
                ) : profileUser?.visibility === "private" && profileUser?.bio === "This profile is private" ? (
                  <div style={{ color: "#6c757d", fontStyle: "italic", textAlign: "center" }}>
                    Education information is private. Connect to view education details.
                  </div>
                ) : (
                  <div style={{ color: "#6c757d", fontStyle: "italic", textAlign: "center" }}>
                    No education information available.
                  </div>
                )}
              </div>
            </div>

            {/* Projects */}
            <div className="projects">
              <h2>Projects</h2>

              <div className="project-boxes">
                {profileUser && profileUser?.projects && profileUser?.projects.length > 0 ? (
                  profileUser?.projects.map((project, index) => (
                    <Box
                      key={index}
                      head={project?.title}
                      date={convertDate(project?.startDate) + " - " + convertDate(project?.endDate)}
                      desc={project?.description}
                      skills={project?.techStack}
                    />
                  ))
                ) : profileUser?.visibility === "private" && profileUser?.bio === "This profile is private" ? (
                  <div style={{ color: "#6c757d", fontStyle: "italic", textAlign: "center" }}>
                    Project information is private. Connect to view projects.
                  </div>
                ) : (
                  <div style={{ color: "#6c757d", fontStyle: "italic", textAlign: "center" }}>
                    No projects available.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
