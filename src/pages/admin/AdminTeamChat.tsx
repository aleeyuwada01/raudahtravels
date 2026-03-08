import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Send, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const CHANNELS = ["general", "bookings", "payments", "urgent"];

const AdminTeamChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState("general");
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["team-messages", channel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_messages")
        .select("*")
        .eq("channel", channel)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["chat-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name || "Staff"]));

  // Realtime subscription
  useEffect(() => {
    const sub = supabase
      .channel(`team-chat-${channel}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "team_messages", filter: `channel=eq.${channel}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["team-messages", channel] });
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [channel, queryClient]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!message.trim() || !user) return;
      const { error } = await supabase.from("team_messages").insert({ sender_id: user.id, content: message.trim(), channel });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["team-messages", channel] });
    },
  });

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Team Chat</h1>
        <p className="text-muted-foreground">Internal real-time messaging for staff</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 h-[calc(100vh-220px)]">
        {/* Channel list */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  ch === channel ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Hash className="h-3.5 w-3.5" />
                {ch}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <Hash className="h-4 w-4" /> {channel}
            </CardTitle>
          </CardHeader>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm py-8">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                const name = profileMap[msg.sender_id] || "Staff";
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <div className={`max-w-[70%] ${isMe ? "text-right" : ""}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium">{isMe ? "You" : name}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), "HH:mm")}</span>
                      </div>
                      <div className={`inline-block rounded-lg px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage.mutate(); }}
              className="flex gap-2"
            >
              <Input
                placeholder={`Message #${channel}…`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!message.trim() || sendMessage.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminTeamChat;
