import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Form from "react-bootstrap/Form";
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "../../util/UserContext";
import Spinner from "react-bootstrap/Spinner";
import { Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import ScrollableFeed from "react-scrollable-feed";
import RequestCard from "./RequestCard";
import "./Chats.css";
import Modal from "react-bootstrap/Modal";
import { motion, AnimatePresence } from "framer-motion";

var socket;
const Chats = () => {
  const [showChatHistory, setShowChatHistory] = useState(true);
  const [showRequests, setShowRequests] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [acceptRequestLoading, setAcceptRequestLoading] = useState(false);

  const [scheduleModalShow, setScheduleModalShow] = useState(false);
  const [requestModalShow, setRequestModalShow] = useState(false);

  // to store selected chat
  const [selectedChat, setSelectedChat] = useState(null);
  // to store chat messages
  const [chatMessages, setChatMessages] = useState([]);
  // to store chats
  const [chats, setChats] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatMessageLoading, setChatMessageLoading] = useState(false);
  // to store message
  const [message, setMessage] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);

  const { user, setUser } = useUser();

  const navigate = useNavigate();

  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    time: "",
  });

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    socket = io(axios.defaults.baseURL);
    if (user) {
      socket.emit("setup", user);
    }
    socket.on("message recieved", (newMessageRecieved) => {
      console.log("New Message Recieved: ", newMessageRecieved);
      console.log("Selected Chat: ", selectedChat);
      console.log("Selected Chat ID: ", selectedChat.id);
      console.log("New Message Chat ID: ", newMessageRecieved.chatId._id);
      if (selectedChat && selectedChat.id === newMessageRecieved.chatId._id) {
        setChatMessages((prevState) => [...prevState, newMessageRecieved]);
      }
    });
    return () => {
      socket.off("message recieved");
    };
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      setChatLoading(true);
      const tempUser = JSON.parse(localStorage.getItem("userInfo"));
      
      if (!tempUser?._id) {
        toast.error("Please login to view chats");
        navigate("/login");
        return;
      }
      
      const { data } = await axios.get("/chat");
      console.log("Chats response:", data);
      
      if (data?.data && Array.isArray(data.data)) {
        const temp = data.data.map((chat) => {
          const otherUser = chat?.users.find((u) => u?._id !== tempUser?._id);
          return {
            id: chat._id,
            name: otherUser?.name || "Unknown User",
            picture: otherUser?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || "User")}&background=667eea&color=fff&size=150`,
            username: otherUser?.username || "unknown",
          };
        });
        setChats(temp);
        if (data.message) {
          toast.success(data.message);
        }
      } else {
        setChats([]);
        console.log("No chats found or invalid response format");
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
      if (err?.response?.status === 401) {
        toast.error("Please login to view chats");
        localStorage.removeItem("userInfo");
        setUser(null);
        navigate("/login");
      } else if (err?.response?.status === 404) {
        toast.error("Chat service not available");
      } else if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK') {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error("Failed to load chats. Please try again.");
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleScheduleClick = () => {
    setScheduleModalShow(true);
  };

  const handleChatClick = async (chatId) => {
    try {
      setChatMessageLoading(true);
      const { data } = await axios.get(`/message/getMessages/${chatId}`);
      setChatMessages(data.data);
      // console.log("Chat Messages:", data.data);
      setMessage("");
      // console.log("Chats: ", chats);
      const chatDetails = chats.find((chat) => chat.id === chatId);
      setSelectedChat(chatDetails);
      // console.log("selectedChat", chatDetails);
      // console.log("Data", data.message);
      socket.emit("join chat", chatId);
      toast.success(data.message);
    } catch (err) {
      console.log(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
        if (err.response.data.message === "Please Login") {
          localStorage.removeItem("userInfo");
          setUser(null);
          await axios.get("/auth/logout");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setChatMessageLoading(false);
    }
  };

  const sendMessage = async (e) => {
    try {
      socket.emit("stop typing", selectedChat._id);
      if (message === "") {
        toast.error("Message is empty");
        return;
      }
      const { data } = await axios.post("/message/sendMessage", { chatId: selectedChat.id, content: message });
      // console.log("after sending message", data);
      socket.emit("new message", data.data);
      setChatMessages((prevState) => [...prevState, data.data]);
      setMessage("");
      // console.log("Data", data.message);
      toast.success(data.message);
    } catch (err) {
      console.log(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
        if (err.response.data.message === "Please Login") {
          await axios.get("/auth/logout");
          setUser(null);
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const getRequests = async () => {
    try {
      setRequestLoading(true);
      const { data } = await axios.get("/request/all");
      console.log("Requests response:", data);
      
      if (data?.data && data.data.received && Array.isArray(data.data.received)) {
        // Map the received requests to include sender details
        const mappedRequests = data.data.received.map(request => ({
          _id: request._id, // This is the request ID
          name: request.sender?.name || "Unknown User",
          picture: request.sender?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.sender?.name || "User")}&background=667eea&color=fff&size=150`,
          username: request.sender?.username || "unknown",
          senderId: request.sender?._id, // Store sender ID for accept/reject
          status: request.status,
          offeredSkill: request.offeredSkill,
          requestedSkill: request.requestedSkill,
          message: request.message
        }));
        setRequests(mappedRequests);
        if (data.message) {
          toast.success(data.message);
        }
      } else {
        setRequests([]);
        console.log("No requests found or invalid response format");
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      if (err?.response?.status === 401) {
        toast.error("Please login to view requests");
        localStorage.removeItem("userInfo");
        setUser(null);
        navigate("/login");
      } else if (err?.response?.status === 404) {
        toast.error("Request service not available");
      } else if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK') {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error("Failed to load requests. Please try again.");
      }
    } finally {
      setRequestLoading(false);
    }
  };

  const handleTabClick = async (tab) => {
    if (tab === "chat") {
      setShowChatHistory(true);
      setShowRequests(false);
      await fetchChats();
    } else if (tab === "requests") {
      setShowChatHistory(false);
      setShowRequests(true);
      await getRequests();
    }
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setRequestModalShow(true);
  };

  const handleRequestAccept = async (e) => {
    console.log("Request accepted");

    try {
      setAcceptRequestLoading(true);
      const { data } = await axios.post("/request/accept", { requestId: selectedRequest.senderId });
      console.log(data);
      toast.success(data.message);
      // remove this request from the requests list
      setRequests((prevState) => prevState.filter((request) => request._id !== selectedRequest._id));
    } catch (err) {
      console.log(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
        if (err.response.data.message === "Please Login") {
          await axios.get("/auth/logout");
          setUser(null);
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setAcceptRequestLoading(false);
      setRequestModalShow(false);
    }
  };

  const handleRequestReject = async () => {
    console.log("Request rejected");
    try {
      setAcceptRequestLoading(true);
      const { data } = await axios.post("/request/reject", { requestId: selectedRequest.senderId });
      console.log(data);
      toast.success(data.message);
      setRequests((prevState) => prevState.filter((request) => request._id !== selectedRequest._id));
    } catch (err) {
      console.log(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
        if (err.response.data.message === "Please Login") {
          await axios.get("/auth/logout");
          setUser(null);
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setAcceptRequestLoading(false);
      setRequestModalShow(false);
    }
  };

  // Add a function to delete/cancel a request
  const handleRequestDelete = async (requestId) => {
    try {
      setRequestLoading(true);
      const { data } = await axios.delete(`/request/delete/${requestId}`);
      toast.success(data.message || 'Request deleted successfully');
      setRequests((prevState) => prevState.filter((request) => request._id !== requestId));
    } catch (err) {
      console.log(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="chats-container">
      {/* Animated Background */}
      <div className="chats-background">
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 100 - 50, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="chats-layout">
        {/* Left Sidebar - Chat List */}
        <motion.div 
          className="chats-sidebar"
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="sidebar-header">
            <h2 className="sidebar-title">
              <span className="title-icon">💬</span>
              Messages
            </h2>
          </div>

          {/* Tabs */}
          <div className="chats-tabs">
            <motion.button
              className={`tab-button ${showChatHistory ? 'active' : ''}`}
              onClick={() => handleTabClick("chat")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="tab-icon">📱</span>
              Chat History
            </motion.button>
            <motion.button
              className={`tab-button ${showRequests ? 'active' : ''}`}
              onClick={() => handleTabClick("requests")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="tab-icon">📨</span>
              Requests
            </motion.button>
          </div>

          {/* Chat/Request List */}
          <div className="chats-list-container">
            <AnimatePresence mode="wait">
              {showChatHistory ? (
                <motion.div
                  key="chats"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="chats-list"
                >
                  {chatLoading ? (
                    <div className="loading-container">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="loading-spinner"
                      />
                      <p>Loading chats...</p>
                    </div>
                  ) : chats.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">💭</div>
                      <h3>No chats yet</h3>
                      <p>Start connecting with other users to see your chats here!</p>
                    </div>
                  ) : (
                    chats.map((chat, index) => (
                      <motion.div
                        key={chat.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                        onClick={() => handleChatClick(chat.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="chat-avatar">
                          <img 
                            src={chat.picture} 
                            alt={chat.name}
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name)}&background=667eea&color=fff&size=150`;
                            }}
                          />
                          <div className="online-indicator"></div>
                        </div>
                        <div className="chat-info">
                          <h4 className="chat-name">{chat.name}</h4>
                          <p className="chat-username">@{chat.username}</p>
                        </div>
                        <div className="chat-actions">
                          <motion.div
                            className="chat-dot"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="requests-list"
                >
                  {requestLoading ? (
                    <div className="loading-container">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="loading-spinner"
                      />
                      <p>Loading requests...</p>
                    </div>
                  ) : requests.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📬</div>
                      <h3>No requests</h3>
                      <p>You don't have any pending requests at the moment.</p>
                    </div>
                  ) : (
                    requests.map((request, index) => (
                      <motion.div
                        key={request.id || request._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="request-item"
                        onClick={() => handleRequestClick(request)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="request-avatar">
                          <img 
                            src={request.picture} 
                            alt={request.name}
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.name)}&background=667eea&color=fff&size=150`;
                            }}
                          />
                        </div>
                        <div className="request-info">
                          <h4 className="request-name">{request.name}</h4>
                          <p className="request-status">{request.status || 'Pending'}</p>
                        </div>
                        {(request.senderId === user?._id && request.status === 'Pending') && (
                          <motion.button
                            className="delete-request-btn"
                            onClick={(e) => { e.stopPropagation(); handleRequestDelete(request._id); }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            🗑️
                          </motion.button>
                        )}
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right Side - Chat Area */}
        <motion.div 
          className="chat-area"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <motion.div 
                className="chat-header"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="chat-user-info">
                  <div className="chat-user-avatar">
                    <img 
                      src={selectedChat.picture} 
                      alt={selectedChat.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.name)}&background=667eea&color=fff&size=150`;
                      }}
                    />
                    <div className="user-status">
                      <div className="status-dot online"></div>
                    </div>
                  </div>
                  <div className="chat-user-details">
                    <h3 className="chat-user-name">{selectedChat.name}</h3>
                    <p className="chat-user-status">Online</p>
                  </div>
                </div>
                <div className="chat-actions">
                  <motion.button
                    className="video-call-btn"
                    onClick={handleScheduleClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="btn-icon">📹</span>
                    Video Call
                  </motion.button>
                </div>
              </motion.div>

              {/* Messages Area */}
              <div className="messages-container">
                <ScrollableFeed forceScroll="true">
                  <AnimatePresence>
                    {chatMessages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`message-wrapper ${message.sender._id === user._id ? 'sent' : 'received'}`}
                      >
                        <div className="message-bubble">
                          <p className="message-text">{message.content}</p>
                          <span className="message-time">
                            {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </ScrollableFeed>
              </div>

              {/* Message Input */}
              <motion.div 
                className="message-input-container"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="message-input"
                  />
                  <motion.button
                    className="send-button"
                    onClick={sendMessage}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={!message.trim()}
                  >
                    <span className="send-icon">📤</span>
                  </motion.button>
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div 
              className="welcome-screen"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="welcome-content">
                <motion.div
                  className="welcome-icon"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  💬
                </motion.div>
                <h2>Welcome to SkillSwap Chat</h2>
                <p>Select a conversation from the sidebar to start messaging</p>
                <div className="welcome-features">
                  <div className="feature">
                    <span className="feature-icon">🚀</span>
                    <span>Real-time messaging</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">🔒</span>
                    <span>Secure conversations</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">📹</span>
                    <span>Video call support</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Request Modal */}
      <AnimatePresence>
        {requestModalShow && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRequestModalShow(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Confirm your choice?</h2>
                              {selectedRequest && (
                  <RequestCard
                    name={selectedRequest?.name}
                    skills={[selectedRequest?.offeredSkill, selectedRequest?.requestedSkill].filter(Boolean)}
                    rating="4"
                    picture={selectedRequest?.picture}
                    username={selectedRequest?.username}
                    onClose={() => setSelectedRequest(null)}
                  />
                )}
              <div className="modal-actions">
                <motion.button
                  className="accept-btn"
                  onClick={handleRequestAccept}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {acceptRequestLoading ? (
                    <div className="loading-spinner-small" />
                  ) : (
                    "Accept!"
                  )}
                </motion.button>
                <motion.button
                  className="reject-btn"
                  onClick={handleRequestReject}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {acceptRequestLoading ? (
                    <div className="loading-spinner-small" />
                  ) : (
                    "Reject"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {scheduleModalShow && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setScheduleModalShow(false)}
          >
            <motion.div
              className="schedule-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Request a Meeting</h3>
              <Form>
                <Form.Group controlId="formDate" className="form-group">
                  <Form.Label>Preferred Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="form-control-custom"
                  />
                </Form.Group>

                <Form.Group controlId="formTime" className="form-group">
                  <Form.Label>Preferred Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    className="form-control-custom"
                  />
                </Form.Group>

                <div className="modal-actions">
                  <motion.button
                    className="submit-btn"
                    onClick={async (e) => {
                      e.preventDefault();
                      if (scheduleForm.date === "" || scheduleForm.time === "") {
                        toast.error("Please fill all the fields");
                        return;
                      }

                      scheduleForm.username = selectedChat.username;
                      try {
                        const { data } = await axios.post("/user/sendScheduleMeet", scheduleForm);
                        toast.success("Request mail has been sent successfully!");
                        setScheduleForm({
                          date: "",
                          time: "",
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
                        } else {
                          toast.error("Something went wrong");
                        }
                      }
                      setScheduleModalShow(false);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Submit
                  </motion.button>
                  <motion.button
                    className="cancel-btn"
                    onClick={() => setScheduleModalShow(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </Form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chats;
