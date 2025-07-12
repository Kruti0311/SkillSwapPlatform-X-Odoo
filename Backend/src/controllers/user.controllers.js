import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Request } from "../models/request.model.js";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
import { generateJWTToken_username } from "../utils/generateJWTToken.js";
import { uploadOnCloudinary } from "../config/connectCloudinary.js";
import { sendMail } from "../utils/SendMail.js";

export const userDetailsWithoutID = asyncHandler(async (req, res) => {
  console.log("\n******** Inside userDetailsWithoutID Controller function ********");

  return res.status(200).json(new ApiResponse(200, req.user, "User details fetched successfully"));
});

export const UserDetails = asyncHandler(async (req, res) => {
  console.log("\n******** Inside UserDetails Controller function ********");
  const username = req.params.username;

  const user = await User.findOne({ username: username });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const receiverID = user._id;
  const senderID = req.user._id;

  // Check if the profile is private and not the owner
  const isOwner = user._id.toString() === req.user._id.toString();
  const isPrivate = user.visibility === "private";

  // Check if users are connected
  const request = await Request.find({
    $or: [
      { sender: senderID, receiver: receiverID },
      { sender: receiverID, receiver: senderID },
    ],
  });

  const status = request.length > 0 ? request[0].status : "Connect";
  const isConnected = request.length > 0 && request[0].status === "Connected";

  // If profile is private, not the owner, and not connected, return limited data
  if (isPrivate && !isOwner && !isConnected) {
    // Return limited data for private profiles
    const limitedUserData = {
      _id: user._id.toString(), // Ensure this is properly converted to string
      username: user.username,
      name: user.name,
      picture: user.picture,
      visibility: user.visibility,
      bio: "This profile is private",
      rating: user.rating,
      status: status,
      skillsProficientAt: [],
      skillsToLearn: [],
      education: [],
      projects: [],
      linkedinLink: "",
      githubLink: "",
      portfolioLink: "",
    };

    return res
      .status(200)
      .json(new ApiResponse(200, limitedUserData, "Private profile - limited information available"));
  }

  // Remove email from the response for privacy
  const userData = user.toObject();
  delete userData.email;

  // Ensure _id is included in the response
  userData._id = user._id.toString();
  userData.status = status;

  return res
    .status(200)
    .json(new ApiResponse(200, userData, "User details fetched successfully"));
});


export const UnRegisteredUserDetails = asyncHandler(async (req, res) => {
  console.log("\n******** Inside UnRegisteredUserDetails Controller function ********");

  // console.log(" UnRegisteredUserDetail: ", userDetail);
  return res.status(200).json(new ApiResponse(200, req.user, "User details fetched successfully"));
});

export const saveRegUnRegisteredUser = asyncHandler(async (req, res) => {
  console.log("\n******** Inside saveRegUnRegisteredUser Controller function ********");

  const { name, email, username, linkedinLink, githubLink, portfolioLink, skillsProficientAt, skillsToLearn, picture, availability, customTimeSlots, location } =
    req.body;
  // console.log("Body: ", req.body);

  if (!name || !email || !username || skillsProficientAt.length === 0 || skillsToLearn.length === 0) {
    throw new ApiError(400, "Please provide all the details");
  }

  if (!email.match(/^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/)) {
    throw new ApiError(400, "Please provide valid email");
  }

  if (username.length < 3) {
    throw new ApiError(400, "Username should be atleast 3 characters long");
  }

  if (githubLink === "" && linkedinLink === "" && portfolioLink === "") {
    throw new ApiError(400, "Please provide atleast one link");
  }

  const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
  const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
  if ((linkedinLink && !linkedinLink.match(linkedinRegex)) || (githubLink && !githubLink.match(githubRegex))) {
    throw new ApiError(400, "Please provide valid github and linkedin links");
  }

  const existingUser = await User.findOne({ username: username });

  if (existingUser) {
    throw new ApiError(400, "Username already exists");
  }

  const user = await UnRegisteredUser.findOneAndUpdate(
    { email: email },
    {
      name: name,
      username: username,
      linkedinLink: linkedinLink,
      githubLink: githubLink,
      portfolioLink: portfolioLink,
      skillsProficientAt: skillsProficientAt,
      skillsToLearn: skillsToLearn,
      picture: picture,
      availability: availability,
      customTimeSlots: customTimeSlots,
      location: location,
    }
  );

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }
  // console.log(" UnRegisteredUserDetail: ", userDetail);
  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveEduUnRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveEduUnRegisteredUser Function *******");

  const { education, email } = req.body;
  if (education.length === 0) {
    throw new ApiError(400, "Education is required");
  }
  education.forEach((edu) => {
    // console.log("Education: ", edu);
    if (!edu.institution || !edu.degree) {
      throw new ApiError(400, "Please provide all the details");
    }
    if (
      !edu.startDate ||
      !edu.endDate ||
      !edu.score ||
      edu.score < 0 ||
      edu.score > 100 ||
      edu.startDate > edu.endDate
    ) {
      throw new ApiError(400, "Please provide valid score and dates");
    }
  });

  const user = await UnRegisteredUser.findOneAndUpdate({ email: email }, { education: education });

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveAddUnRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveAddUnRegisteredUser Function *******");

  const { bio, projects, email } = req.body;
  if (!bio) {
    throw new ApiError(400, "Bio is required");
  }
  if (bio.length > 500) {
    throw new ApiError(400, "Bio should be less than 500 characters");
  }

  if (projects.size > 0) {
    projects.forEach((project) => {
      if (!project.title || !project.description || !project.projectLink || !project.startDate || !project.endDate) {
        throw new ApiError(400, "Please provide all the details");
      }
      if (project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
        throw new ApiError(400, "Please provide valid project link");
      }
      if (project.startDate > project.endDate) {
        throw new ApiError(400, "Please provide valid dates");
      }
    });
  }

  const user = await UnRegisteredUser.findOneAndUpdate({ email: email }, { bio: bio, projects: projects });

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const registerUser = async (req, res) => {
  console.log("\n******** Inside registerUser function ********");
  // First check if the user is already registered
  // if the user is already registerd than send a message that the user is already registered
  // redirect him to the discover page
  // if the user is not registered than create a new user and redirect him to the discover page after generating the token and setting the cookie and also delete the user detail from unregistered user from the database
  console.log("User:", req.user);

  const {
    name,
    email,
    username,
    linkedinLink,
    githubLink,
    portfolioLink,
    skillsProficientAt,
    skillsToLearn,
    education,
    bio,
    projects,
    picture,
    availability,
    customTimeSlots,
    location,
  } = req.body;

  console.log("Registration - Uploaded picture:", picture);
  console.log("Registration - OAuth picture:", req.user.picture);

  if (!name || !email || !username || skillsProficientAt.length === 0 || skillsToLearn.length === 0) {
    throw new ApiError(400, "Please provide all the details");
  }
  if (!email.match(/^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/)) {
    throw new ApiError(400, "Please provide valid email");
  }
  if (username.length < 3) {
    throw new ApiError(400, "Username should be atleast 3 characters long");
  }
  if (githubLink === "" && linkedinLink === "" && portfolioLink === "") {
    throw new ApiError(400, "Please provide atleast one link");
  }
  const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
  const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
  if ((linkedinLink && !linkedinLink.match(linkedinRegex)) || (githubLink && !githubLink.match(githubRegex))) {
    throw new ApiError(400, "Please provide valid github and linkedin links");
  }
  if (education.length === 0) {
    throw new ApiError(400, "Education is required");
  }
  education.forEach((edu) => {
    if (!edu.institution || !edu.degree) {
      throw new ApiError(400, "Please provide all the details");
    }
    if (
      !edu.startDate ||
      !edu.endDate ||
      !edu.score ||
      edu.score < 0 ||
      edu.score > 100 ||
      edu.startDate > edu.endDate
    ) {
      throw new ApiError(400, "Please provide valid score and dates");
    }
  });
  if (!bio) {
    throw new ApiError(400, "Bio is required");
  }
  if (bio.length > 500) {
    throw new ApiError(400, "Bio should be less than 500 characters");
  }
  if (projects.size > 0) {
    projects.forEach((project) => {
      if (!project.title || !project.description || !project.projectLink || !project.startDate || !project.endDate) {
        throw new ApiError(400, "Please provide all the details");
      }
      if (project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
        throw new ApiError(400, "Please provide valid project link");
      }
      if (project.startDate > project.endDate) {
        throw new ApiError(400, "Please provide valid dates");
      }
    });
  }

  const existingUser = await User.findOne({ email: email });

  if (existingUser) {
    throw new ApiError(400, "User Already registered");
  }

  const checkUsername = await User.findOne({ username: username });
  if (checkUsername) {
    throw new ApiError(400, "Username already exists");
  }

  const newUser = await User.create({
    name: name,
    email: email,
    username: username,
    linkedinLink: linkedinLink,
    githubLink: githubLink,
    portfolioLink: portfolioLink,
    visibility: req.body.visibility || "public",
    skillsProficientAt: skillsProficientAt,
    skillsToLearn: skillsToLearn,
    education: education,
    bio: bio,
    projects: projects,
    picture: picture && picture.trim() !== "" ? picture : req.user.picture,
    availability: availability,
    customTimeSlots: customTimeSlots,
    location: location,
  });

  if (!newUser) {
    throw new ApiError(500, "Error in saving user details");
  }

  await UnRegisteredUser.findOneAndDelete({ email: email });

  const jwtToken = generateJWTToken_username(newUser);
  const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
  res.cookie("accessToken", jwtToken, { httpOnly: true, expires: expiryDate, secure: false });
  res.clearCookie("accessTokenRegistration");
  return res.status(200).json(new ApiResponse(200, newUser, "NewUser registered successfully"));
};

export const saveRegRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveRegRegisteredUser Function *******");

  const {
    name,
    username,
    linkedinLink,
    githubLink,
    portfolioLink,
    skillsProficientAt,
    skillsToLearn,
    picture,
    visibility,
    availability,
    customTimeSlots,
    location,
  } = req.body;

  console.log("Body: ", req.body);

  if (!name || !username || skillsProficientAt.length === 0 || skillsToLearn.length === 0) {
    throw new ApiError(400, "Please provide all the details");
  }

  if (username.length < 3) {
    throw new ApiError(400, "Username should be atleast 3 characters long");
  }

  if (githubLink === "" && linkedinLink === "" && portfolioLink === "") {
    throw new ApiError(400, "Please provide atleast one link");
  }

  const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
  const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
  if ((linkedinLink && !linkedinLink.match(linkedinRegex)) || (githubLink && !githubLink.match(githubRegex))) {
    throw new ApiError(400, "Please provide valid github and linkedin links");
  }

  const user = await User.findOneAndUpdate(
    { username: req.user.username },
    {
      name: name,
      username: username,
      linkedinLink: linkedinLink,
      githubLink: githubLink,
      portfolioLink: portfolioLink,
      skillsProficientAt: skillsProficientAt,
      skillsToLearn: skillsToLearn,
      picture: picture,
      visibility: visibility || "public",
      availability: availability,
      customTimeSlots: customTimeSlots,
      location: location,
    }
  );

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveEduRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveEduRegisteredUser Function *******");

  const { education } = req.body;

  if (education.length === 0) {
    throw new ApiError(400, "Education is required");
  }

  education.forEach((edu) => {
    if (!edu.institution || !edu.degree) {
      throw new ApiError(400, "Please provide all the details");
    }
    if (
      !edu.startDate ||
      !edu.endDate ||
      !edu.score ||
      edu.score < 0 ||
      edu.score > 100 ||
      edu.startDate > edu.endDate
    ) {
      throw new ApiError(400, "Please provide valid score and dates");
    }
  });

  const user = await User.findOneAndUpdate({ username: req.user.username }, { education: education });

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveAddRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveAddRegisteredUser Function *******");

  const { bio, projects } = req.body;

  if (!bio) {
    throw new ApiError(400, "Bio is required");
  }

  if (bio.length > 500) {
    throw new ApiError(400, "Bio should be less than 500 characters");
  }

  if (projects.size > 0) {
    projects.forEach((project) => {
      if (!project.title || !project.description || !project.projectLink || !project.startDate || !project.endDate) {
        throw new ApiError(400, "Please provide all the details");
      }
      if (project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
        throw new ApiError(400, "Please provide valid project link");
      }
      if (project.startDate > project.endDate) {
        throw new ApiError(400, "Please provide valid dates");
      }
    });
  }

  const user = await User.findOneAndUpdate({ username: req.user.username }, { bio: bio, projects: projects });

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

// export const updateRegisteredUser = asyncHandler(async (req, res) => {
//   console.log("******** Inside updateRegisteredUser Function *******");

//   const {
//     name,
//     username,
//     linkedinLink,
//     githubLink,
//     portfolioLink,
//     skillsProficientAt,
//     skillsToLearn,
//     education,
//     bio,
//     projects,
//   } = req.body;

//   if (!name || !username || skillsProficientAt.length === 0 || skillsToLearn.length === 0) {
//     throw new ApiError(400, "Please provide all the details");
//   }

//   if (username.length < 3) {
//     throw new ApiError(400, "Username should be atleast 3 characters long");
//   }

//   if (githubLink === "" && linkedinLink === "" && portfolioLink === "") {
//     throw new ApiError(400, "Please provide atleast one link");
//   }

//   const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
//   const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
//   if ((linkedinLink && !linkedinLink.match(linkedinRegex)) || (githubLink && !githubLink.match(githubRegex))) {
//     throw new ApiError(400, "Please provide valid github and linkedin links");
//   }

//   if (education.length === 0) {
//     throw new ApiError(400, "Education is required");
//   }

//   education.forEach((edu) => {
//     if (!edu.institution || !edu.degree) {
//       throw new ApiError(400, "Please provide all the details");
//     }
//     if (
//       !edu.startDate ||
//       !edu.endDate ||
//       !edu.score ||
//       edu.score < 0 ||
//       edu.score > 100 ||
//       edu.startDate > edu.endDate
//     ) {
//       throw new ApiError(400, "Please provide valid score and dates");
//     }
//   });

//   if (!bio) {
//     throw new ApiError(400, "Bio is required");
//   }

//   if (bio.length > 500) {
//     throw new ApiError(400, "Bio should be less than 500 characters");
//   }

//   if (projects.size > 0) {
//     projects.forEach((project) => {
//       if (!project.title || !project.description || !project.projectLink || !project.startDate || !project.endDate) {
//         throw new ApiError(400, "Please provide all the details");
//       }
//       if (project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
//         throw new ApiError(400, "Please provide valid project link");
//       }
//       if (project.startDate > project.endDate) {
//         throw new ApiError(400, "Please provide valid dates");
//       }
//     });
//   }

//   const user = await User.findOneAndUpdate(
//     { username: req.user.username },
//     {
//       name: name,
//       username: username,
//       linkedinLink: linkedinLink,
//       githubLink: githubLink,
//       portfolioLink: portfolioLink,
//       skillsProficientAt: skillsProficientAt,
//       skillsToLearn: skillsToLearn,
//       education: education,
//       bio: bio,
//       projects: projects,
//     }
//   );

//   if (!user) {
//     throw new ApiError(500, "Error in saving user details");
//   }

//   return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
// });

export const uploadPic = asyncHandler(async (req, res) => {
  const LocalPath = req.files?.picture[0]?.path;

  if (!LocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const picture = await uploadOnCloudinary(LocalPath);
  if (!picture) {
    throw new ApiError(500, "Error uploading picture");
  }

  res.status(200).json(new ApiResponse(200, { url: picture.url }, "Picture uploaded successfully"));
});

// Update the discoverUsers function to include visibility
export const discoverUsers = asyncHandler(async (req, res) => {
  console.log("******** Inside discoverUsers Function *******");

  const webDevSkills = [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Angular",
    "Vue",
    "Node.js",
    "Express",
    "MongoDB",
    "SQL",
    "NoSQL",
  ];

  const machineLearningSkills = [
    "Python",
    "Natural Language Processing",
    "Deep Learning",
    "PyTorch",
    "Machine Learning",
  ];

  // Fetch all users except the current user and banned users, including visibility field
  const users = await User.find({ username: { $ne: req.user.username }, banned: { $ne: true } }).select(
    "username name picture bio rating skillsProficientAt visibility"
  );

  if (!users) {
    throw new ApiError(500, "Error in fetching users");
  }

  const usersToLearn = [];
  const webDevUsers = [];
  const mlUsers = [];
  const otherUsers = [];

  // Randomly shuffle the users array
  users.sort(() => Math.random() - 0.5);

  users.forEach((user) => {
    const userObj = user.toObject();

    if (user.skillsProficientAt.some((skill) => req.user.skillsToLearn.includes(skill)) && usersToLearn.length < 5) {
      usersToLearn.push(userObj);
    } else if (user.skillsProficientAt.some((skill) => webDevSkills.includes(skill)) && webDevUsers.length < 5) {
      webDevUsers.push(userObj);
    } else if (user.skillsProficientAt.some((skill) => machineLearningSkills.includes(skill)) && mlUsers.length < 5) {
      mlUsers.push(userObj);
    } else {
      if (otherUsers.length < 5) otherUsers.push(userObj);
    }
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { forYou: usersToLearn, webDev: webDevUsers, ml: mlUsers, others: otherUsers },
        "Users fetched successfully"
      )
    );
});

export const sendScheduleMeet = asyncHandler(async (req, res) => {
  console.log("******** Inside sendScheduleMeet Function *******");

  const { date, time, username } = req.body;
  if (!date || !time || !username) {
    throw new ApiError(400, "Please provide all the details");
  }

  const user = await User.findOne({ username: username });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const to = user.email;
  const subject = "Request for Scheduling a meeting";
  const message = `${req.user.name} has requested for a meet at ${time} time on ${date} date. Please respond to the request.`;

  await sendMail(to, subject, message);

  return res.status(200).json(new ApiResponse(200, null, "Email sent successfully"));
});

export const updateProfileVisibility = asyncHandler(async (req, res) => {
  const { visibility } = req.body;

  if (!["public", "private"].includes(visibility)) {
    throw new ApiError(400, "Invalid visibility option. Must be 'public' or 'private'");
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, { visibility }, { new: true }).select("-email");

  return res.status(200).json(new ApiResponse(200, updatedUser, "Profile visibility updated successfully"));
});

export const createRequest = asyncHandler(async (req, res) => {
  const { receiverID } = req.body;
  
  // Check if the receiver exists
  const receiver = await User.findById(receiverID);
  if (!receiver) {
    throw new ApiError(404, "Receiver not found");
  }

  // Check if a connection request already exists between the users
  const existingRequest = await Request.findOne({
    $or: [
      { sender: req.user._id, receiver: receiverID },
      { sender: receiverID, receiver: req.user._id },
    ],
  });

  if (existingRequest) {
    throw new ApiError(400, "Connection request already exists");
  }

  // Create new connection request
  const newRequest = await Request.create({
    sender: req.user._id,
    receiver: receiverID,
    status: "Pending",
  });

  return res.status(200).json(new ApiResponse(200, newRequest, "Connection request sent successfully"));
});