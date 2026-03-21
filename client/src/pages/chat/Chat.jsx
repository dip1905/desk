import { useState, useEffect, useRef } from "react";
import AppLayout                       from "../../components/layout/AppLayout";
import { PageSpinner }                 from "../../components/ui/Spinner";
import EmptyState                      from "../../components/ui/EmptyState";
import { useDispatch, useSelector }    from "react-redux";
import {
  setChannels,
  setActiveChannel,
  setMessages,
} from "../../store/slices/chatSlice";
import { emitSocketEvent }  from "../../store/middleware/socketMiddleware";
import { getInitials, formatTime } from "../../utils/formatters";
import useAuth              from "../../hooks/useAuth";
import axios                from "axios";
import toast                from "react-hot-toast";
import {
  HiOutlinePaperAirplane,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineHashtag,
  HiOutlineUsers,
} from "react-icons/hi";

const Chat = () => {
  const dispatch          = useDispatch();
  const { user, token }   = useAuth();
  const channels          = useSelector((s) => s.chat.channels);
  const messages          = useSelector((s) => s.chat.messages);
  const activeChannel     = useSelector((s) => s.chat.activeChannel);
  const onlineUsers       = useSelector((s) => s.chat.onlineUsers);
  const typingUsers       = useSelector((s) => s.chat.typingUsers);

  const [content,     setContent]     = useState("");
  const [editingId,   setEditingId]   = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isLoading,   setIsLoading]   = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeout  = useRef(null);

  const API     = import.meta.env.VITE_API_URL;
  const headers = { Authorization: `Bearer ${token}` };

  // Load channels on mount
  useEffect(() => {
    const fetchChannels = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          `${API}/chat/channels`, { headers }
        );
        dispatch(setChannels(res.data.data));

        // Auto select first channel
        if (res.data.data.length > 0) {
          selectChannel(res.data.data[0].id);
        }
      } catch {
        toast.error("Failed to load channels");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChannels();
  }, []);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[activeChannel]]);

  const selectChannel = async (channelId) => {
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

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim() || !activeChannel) return;

    dispatch(emitSocketEvent("message:send", {
      channelId: activeChannel,
      content:   content.trim(),
    }));

    // Stop typing indicator
    dispatch(emitSocketEvent("typing:stop", {
      channelId: activeChannel
    }));

    setContent("");
  };

  const handleTyping = (e) => {
    setContent(e.target.value);

    // Emit typing start
    dispatch(emitSocketEvent("typing:start", {
      channelId: activeChannel
    }));

    // Clear previous timeout
    clearTimeout(typingTimeout.current);

    // Stop typing after 2 seconds of no input
    typingTimeout.current = setTimeout(() => {
      dispatch(emitSocketEvent("typing:stop", {
        channelId: activeChannel
      }));
    }, 2000);
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
    setEditContent("");
  };

  const handleDelete = (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    dispatch(emitSocketEvent("message:delete", { messageId }));
  };

  const currentMessages = messages[activeChannel] || [];
  const activeChannelData = channels.find(
    (c) => c.id === activeChannel
  );

  // Get typing users for active channel
  const whoIsTyping = (typingUsers[activeChannel] || [])
    .filter((t) => t.userId !== user?.id);

  // Check if user is online
  const isOnline = (userId) => onlineUsers.includes(userId);

  return (
    <AppLayout title="Chat">
      <div className="flex gap-4 h-[calc(100vh-8rem)]">

        {/* ─── Channel Sidebar ────────────────────── */}
        <div className="w-64 bg-white rounded-xl border
          border-gray-100 shadow-sm flex flex-col flex-shrink-0">

          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">
              Channels
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {channels.length} channels
            </p>
          </div>

          {/* Channel List */}
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
                    ${activeChannel === channel.id
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <HiOutlineHashtag className="text-sm flex-shrink-0" />
                  <span className="truncate flex-1">
                    {channel.name}
                  </span>
                  {channel.isPrivate && (
                    <span className="text-[10px] bg-gray-100
                      text-gray-400 px-1.5 py-0.5 rounded">
                      Private
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Online Members */}
          {activeChannelData && (
            <div className="border-t border-gray-100 p-3">
              <p className="text-xs font-semibold text-gray-500
                uppercase tracking-wider mb-2 flex items-center gap-1">
                <HiOutlineUsers className="text-sm" />
                Members
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
                        {/* Online indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5
                          w-2.5 h-2.5 rounded-full border-2
                          border-white
                          ${isOnline(m.userId)
                            ? "bg-green-500"
                            : "bg-gray-300"
                          }`}
                        />
                      </div>
                      <span className={`text-xs truncate
                        ${isOnline(m.userId)
                          ? "text-gray-700 font-medium"
                          : "text-gray-400"
                        }`}>
                        {m.user?.name?.split(" ")[0]}
                      </span>
                    </div>
                  ))
                }
                {(activeChannelData.members?.length || 0) > 5 && (
                  <p className="text-xs text-gray-400">
                    +{activeChannelData.members.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Main Chat Area ──────────────────────── */}
        <div className="flex-1 bg-white rounded-xl border
          border-gray-100 shadow-sm flex flex-col min-w-0">

          {!activeChannel ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon="💬"
                title="Select a channel"
                description="Choose a channel to start chatting"
              />
            </div>
          ) : (
            <>
              {/* Channel Header */}
              <div className="p-4 border-b border-gray-100
                flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiOutlineHashtag className="text-gray-400" />
                  <h3 className="font-semibold text-gray-800">
                    {activeChannelData?.name}
                  </h3>
                  {activeChannelData?.isPrivate && (
                    <span className="text-xs bg-gray-100
                      text-gray-500 px-2 py-0.5 rounded-full">
                      Private
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {activeChannelData?.members?.length || 0} members •{" "}
                  <span className="text-green-500 font-medium">
                    {onlineUsers.length} online
                  </span>
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
                      description="Be the first to say something!"
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
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full
                            bg-blue-500 flex items-center
                            justify-center text-white text-xs
                            font-bold">
                            {msg.sender?.avatar
                              ? <img
                                  src={msg.sender.avatar}
                                  alt=""
                                  className="w-full h-full
                                    rounded-full object-cover"
                                />
                              : getInitials(msg.sender?.name)
                            }
                          </div>
                          {/* Online dot */}
                          <div className={`absolute -bottom-0.5
                            -right-0.5 w-2.5 h-2.5 rounded-full
                            border-2 border-white
                            ${isOnline(msg.senderId)
                              ? "bg-green-500"
                              : "bg-gray-300"
                            }`}
                          />
                        </div>

                        {/* Message Bubble */}
                        <div className={`max-w-xs lg:max-w-md
                          flex flex-col
                          ${isOwn ? "items-end" : "items-start"}`}>

                          {/* Sender + Time */}
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
                                italic">
                                (edited)
                              </span>
                            )}
                          </div>

                          {/* Content */}
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

                        {/* Actions on hover */}
                        {!msg.isDeleted && isOwn && (
                          <div className="opacity-0
                            group-hover:opacity-100 flex items-center
                            gap-1 transition-opacity self-center">
                            <button
                              onClick={() => handleEdit(msg)}
                              className="p-1 text-gray-400
                                hover:text-blue-500 hover:bg-blue-50
                                rounded transition-colors"
                              title="Edit"
                            >
                              <HiOutlinePencil className="text-xs" />
                            </button>
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="p-1 text-gray-400
                                hover:text-red-500 hover:bg-red-50
                                rounded transition-colors"
                              title="Delete"
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
                    placeholder={`Message #${activeChannelData?.name}`}
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