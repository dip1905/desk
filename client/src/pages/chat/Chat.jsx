import { useState, useEffect, useRef } from "react";
import AppLayout                        from "../../components/layout/AppLayout";
import { PageSpinner }                  from "../../components/ui/Spinner";
import EmptyState                       from "../../components/ui/EmptyState";
import { useDispatch, useSelector }     from "react-redux";
import {
  setChannels,
  setActiveChannel,
  setMessages,
} from "../../store/slices/chatSlice";
import { emitSocketEvent }   from "../../store/middleware/socketMiddleware";
import { getInitials, formatTime } from "../../utils/formatters";
import useAuth               from "../../hooks/useAuth";
import axios                 from "axios";
import toast                 from "react-hot-toast";
import {
  HiOutlinePaperAirplane,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineHashtag,
  HiOutlineUsers,
  HiOutlineChat,
} from "react-icons/hi";

const Chat = () => {
  const dispatch          = useDispatch();
  const { user, token }   = useAuth();
  const channels          = useSelector((s) => s.chat.channels);
  const messages          = useSelector((s) => s.chat.messages);
  const activeChannel     = useSelector((s) => s.chat.activeChannel);
  const onlineUsers       = useSelector((s) => s.chat.onlineUsers);
  const typingUsers       = useSelector((s) => s.chat.typingUsers);

  const [content,      setContent]      = useState("");
  const [editingId,    setEditingId]    = useState(null);
  const [editContent,  setEditContent]  = useState("");
  const [isLoading,    setIsLoading]    = useState(false);
  const [activeTab,    setActiveTab]    = useState("channels");
  const [employees,    setEmployees]    = useState([]);
  const [activeDM,     setActiveDM]     = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeout  = useRef(null);

  const API     = import.meta.env.VITE_API_URL;
  const headers = { Authorization: `Bearer ${token}` };

  // Load channels and employees on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Load channels
        const channelRes = await axios.get(
          `${API}/chat/channels`, { headers }
        );
        dispatch(setChannels(channelRes.data.data));

        if (channelRes.data.data.length > 0) {
          selectChannel(channelRes.data.data[0].id);
        }

        // Load all employees for DM
        const empRes = await axios.get(
          `${API}/employees`, { headers }
        );
        setEmployees(
          (empRes.data.data?.employees || [])
            .filter((e) => e.id !== user?.id)
        );

      } catch {
        toast.error("Failed to load chat data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[activeChannel], messages[`dm_${activeDM?.id}`]]);

  const selectChannel = async (channelId) => {
    setActiveDM(null);
    dispatch(setActiveChannel(channelId));
    dispatch(emitSocketEvent("channel:join", channelId));

    try {
      const res = await axios.get(
        `${API}/chat/channels/${channelId}/messages`,
        { headers }
      );
      dispatch(setMessages({
        channelId, messages: res.data.data
      }));
    } catch {
      toast.error("Failed to load messages");
    }
  };

  const selectDM = async (emp) => {
    setActiveDM(emp);
    dispatch(setActiveChannel(null));
    const dmKey = `dm_${emp.id}`;

    try {
      const res = await axios.get(
        `${API}/chat/dm/${emp.id}/messages`,
        { headers }
      );
      dispatch(setMessages({
        channelId: dmKey,
        messages:  res.data.data
      }));
    } catch {
      toast.error("Failed to load messages");
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (activeDM) {
      // Send DM
      dispatch(emitSocketEvent("dm:send", {
        receiverId: activeDM.id,
        content:    content.trim(),
      }));
    } else if (activeChannel) {
      // Send channel message
      dispatch(emitSocketEvent("message:send", {
        channelId: activeChannel,
        content:   content.trim(),
      }));
    }

    clearTimeout(typingTimeout.current);
    setContent("");
  };

  const handleTyping = (e) => {
    setContent(e.target.value);
    if (activeChannel) {
      dispatch(emitSocketEvent("typing:start", {
        channelId: activeChannel
      }));
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        dispatch(emitSocketEvent("typing:stop", {
          channelId: activeChannel
        }));
      }, 2000);
    }
  };

  const handleEdit = (msg) => {
    setEditingId(msg.id);
    setEditContent(msg.content || "");
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    dispatch(emitSocketEvent("message:edit", {
      messageId: editingId,
      content:   editContent.trim(),
    }));
    setEditingId(null);
  };

  const handleDelete = (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    dispatch(emitSocketEvent("message:delete", { messageId }));
  };

  const isOnline = (userId) => onlineUsers.includes(userId);

  const activeChannelData = channels.find(
    (c) => c.id === activeChannel
  );

  const currentKey = activeDM
    ? `dm_${activeDM.id}`
    : activeChannel;

  const currentMessages = messages[currentKey] || [];

  const whoIsTyping = activeChannel
    ? (typingUsers[activeChannel] || [])
        .filter((t) => t.userId !== user?.id)
    : [];

  return (
    <AppLayout title="Chat">
      <div className="flex gap-4 h-[calc(100vh-8rem)]">

        {/* ─── Left Sidebar ───────────────────────── */}
        <div className="w-64 bg-white rounded-xl border
          border-gray-100 shadow-sm flex flex-col flex-shrink-0">

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab("channels")}
              className={`flex-1 py-3 text-xs font-semibold
                transition-colors flex items-center justify-center gap-1
                ${activeTab === "channels"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-400 hover:text-gray-600"
                }`}
            >
              <HiOutlineHashtag />
              Channels
            </button>
            <button
              onClick={() => setActiveTab("dms")}
              className={`flex-1 py-3 text-xs font-semibold
                transition-colors flex items-center justify-center gap-1
                ${activeTab === "dms"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-400 hover:text-gray-600"
                }`}
            >
              <HiOutlineChat />
              Direct
            </button>
          </div>

          {/* Channel List */}
          {activeTab === "channels" && (
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <PageSpinner />
              ) : channels.length === 0 ? (
                <p className="text-xs text-gray-400 text-center mt-4">
                  No channels available
                </p>
              ) : (
                channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => selectChannel(channel.id)}
                    className={`w-full flex items-center gap-2
                      px-3 py-2.5 rounded-lg text-sm transition-colors
                      text-left mb-0.5
                      ${activeChannel === channel.id && !activeDM
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    <HiOutlineHashtag className="text-sm flex-shrink-0" />
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* DM List — All Employees */}
          {activeTab === "dms" && (
            <div className="flex-1 overflow-y-auto p-2">
              <p className="text-xs text-gray-400 px-3 py-2 font-medium">
                All Employees ({employees.length})
              </p>
              {employees.length === 0 ? (
                <p className="text-xs text-gray-400 text-center mt-4">
                  No employees found
                </p>
              ) : (
                employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => selectDM(emp)}
                    className={`w-full flex items-center gap-2.5
                      px-3 py-2 rounded-lg text-sm transition-colors
                      text-left mb-0.5
                      ${activeDM?.id === emp.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-500
                        flex items-center justify-center text-white
                        text-xs font-bold">
                        {emp.avatar
                          ? <img src={emp.avatar} alt=""
                              className="w-full h-full rounded-full
                                object-cover" />
                          : getInitials(emp.name)
                        }
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5
                        w-2.5 h-2.5 rounded-full border-2 border-white
                        ${isOnline(emp.id)
                          ? "bg-green-500"
                          : "bg-gray-300"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {emp.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {emp.employee?.designation || emp.role}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Online Members for active channel */}
          {activeTab === "channels" && activeChannelData && (
            <div className="border-t border-gray-100 p-3">
              <p className="text-xs font-semibold text-gray-500
                uppercase tracking-wider mb-2">
                Members ({activeChannelData.members?.length || 0})
              </p>
              <div className="space-y-1.5">
                {activeChannelData.members
                  ?.slice(0, 5)
                  .map((m) => (
                    <div key={m.id}
                      className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-6 h-6 rounded-full
                          bg-blue-500 flex items-center justify-center
                          text-white text-[10px] font-bold">
                          {getInitials(m.user?.name)}
                        </div>
                        <div className={`absolute -bottom-0.5
                          -right-0.5 w-2 h-2 rounded-full
                          border border-white
                          ${isOnline(m.userId)
                            ? "bg-green-500"
                            : "bg-gray-300"
                          }`}
                        />
                      </div>
                      <span className="text-xs text-gray-600 truncate">
                        {m.user?.name?.split(" ")[0]}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* ─── Main Chat Area ──────────────────────── */}
        <div className="flex-1 bg-white rounded-xl border
          border-gray-100 shadow-sm flex flex-col min-w-0">

          {!activeChannel && !activeDM ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon="💬"
                title="Select a conversation"
                description="Choose a channel or person to start chatting"
              />
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100
                flex items-center justify-between">
                {activeDM ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-blue-500
                        flex items-center justify-center text-white
                        text-xs font-bold">
                        {getInitials(activeDM.name)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5
                        w-2.5 h-2.5 rounded-full border-2 border-white
                        ${isOnline(activeDM.id)
                          ? "bg-green-500"
                          : "bg-gray-300"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">
                        {activeDM.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {isOnline(activeDM.id) ? "Online" : "Offline"}
                        {" "}• {activeDM.employee?.designation || activeDM.role}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <HiOutlineHashtag className="text-gray-400" />
                    <h3 className="font-semibold text-gray-800">
                      {activeChannelData?.name}
                    </h3>
                  </div>
                )}
                <span className="text-xs text-green-500 font-medium">
                  {onlineUsers.length} online
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.length === 0 ? (
                  <div className="flex items-center
                    justify-center h-full">
                    <EmptyState
                      icon="💭"
                      title="No messages yet"
                      description={activeDM
                        ? `Start a conversation with ${activeDM.name}`
                        : "Be the first to say something!"
                      }
                    />
                  </div>
                ) : (
                  currentMessages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 group
                          ${isOwn ? "flex-row-reverse" : ""}`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full
                            bg-blue-500 flex items-center
                            justify-center text-white text-xs
                            font-bold">
                            {msg.sender?.avatar
                              ? <img src={msg.sender.avatar} alt=""
                                  className="w-full h-full
                                    rounded-full object-cover" />
                              : getInitials(msg.sender?.name)
                            }
                          </div>
                          <div className={`absolute -bottom-0.5
                            -right-0.5 w-2.5 h-2.5 rounded-full
                            border-2 border-white
                            ${isOnline(msg.senderId)
                              ? "bg-green-500"
                              : "bg-gray-300"
                            }`}
                          />
                        </div>

                        <div className={`max-w-xs lg:max-w-md
                          flex flex-col
                          ${isOwn ? "items-end" : "items-start"}`}>
                          <div className={`flex items-center
                            gap-2 mb-1
                            ${isOwn ? "flex-row-reverse" : ""}`}>
                            <span className="text-xs font-medium
                              text-gray-600">
                              {isOwn ? "You" : msg.sender?.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatTime(msg.createdAt)}
                            </span>
                            {msg.isEdited && (
                              <span className="text-xs text-gray-400
                                italic">(edited)</span>
                            )}
                          </div>

                          {editingId === msg.id ? (
                            <div className="flex gap-2 w-full">
                              <input
                                type="text"
                                value={editContent}
                                onChange={(e) =>
                                  setEditContent(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleSaveEdit();
                                  if (e.key === "Escape")
                                    setEditingId(null);
                                }}
                                className="flex-1 px-3 py-1.5
                                  border border-blue-300 rounded-lg
                                  text-sm focus:outline-none
                                  focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="text-xs bg-blue-600
                                  text-white px-2 py-1 rounded-lg"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-xs bg-gray-200
                                  text-gray-600 px-2 py-1 rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className={`px-3 py-2 rounded-xl
                              text-sm
                              ${msg.isDeleted
                                ? "bg-gray-100 text-gray-400 italic"
                                : isOwn
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                              {msg.isDeleted
                                ? "This message was deleted"
                                : msg.content
                              }
                            </div>
                          )}
                        </div>

                        {!msg.isDeleted && isOwn && (
                          <div className="opacity-0
                            group-hover:opacity-100 flex items-center
                            gap-1 transition-opacity self-center">
                            <button
                              onClick={() => handleEdit(msg)}
                              className="p-1 text-gray-400
                                hover:text-blue-500 hover:bg-blue-50
                                rounded transition-colors"
                            >
                              <HiOutlinePencil className="text-xs" />
                            </button>
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="p-1 text-gray-400
                                hover:text-red-500 hover:bg-red-50
                                rounded transition-colors"
                            >
                              <HiOutlineTrash className="text-xs" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing Indicator */}
              {whoIsTyping.length > 0 && (
                <div className="px-4 pb-1">
                  <p className="text-xs text-gray-400 italic">
                    {whoIsTyping.map((t) => t.name).join(", ")}{" "}
                    {whoIsTyping.length === 1
                      ? "is typing..."
                      : "are typing..."
                    }
                  </p>
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t border-gray-100">
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={content}
                    onChange={handleTyping}
                    placeholder={activeDM
                      ? `Message ${activeDM.name}...`
                      : `Message #${activeChannelData?.name}`
                    }
                    className="flex-1 px-4 py-2.5 bg-gray-100
                      rounded-xl text-sm focus:outline-none
                      focus:ring-2 focus:ring-blue-500
                      focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!content.trim()}
                    className="w-10 h-10 bg-blue-600
                      hover:bg-blue-700 disabled:bg-blue-300
                      text-white rounded-xl flex items-center
                      justify-center transition-colors"
                  >
                    <HiOutlinePaperAirplane
                      className="text-lg rotate-90"
                    />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

      </div>
    </AppLayout>
  );
};

export default Chat;