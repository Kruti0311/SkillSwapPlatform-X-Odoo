import React from "react";
import Card from "react-bootstrap/Card";
import "./Card.css";
import { Link } from "react-router-dom";
import { FaLock } from "react-icons/fa"; // Add this import

const ProfileCard = ({ profileImageUrl, bio, name, skills, rating, username, visibility }) => {
  return (
    <div className="card-container">
      <img className="img-container" src={profileImageUrl} alt="user" />
      <h3>
        {name}
        {visibility === "private" && (
          <FaLock
            style={{
              marginLeft: "8px",
              fontSize: "0.8em",
              color: "#999",
            }}
            title="Private Profile"
          />
        )}
      </h3>
      <h6>Rating: {rating} ⭐</h6>
      <p style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "150px" }}>{bio}</p>
      <div className="prof-buttons">
        <Link to={`/profile/${username}`}>
          <button className="primary ghost">View Profile</button>
        </Link>
        {visibility === "private" && (
          <div
            style={{
              fontSize: "0.8em",
              color: "#999",
              marginTop: "5px",
              textAlign: "center",
            }}
          >
            🔒 Private Profile - Connect to see more
          </div>
        )}
      </div>
      <div className="profskills">
        <h6>Skills</h6>
        <div className="profskill-boxes">
          {skills.map((skill, index) => (
            <div key={index} className="profskill-box">
              <span className="skill">{skill}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
