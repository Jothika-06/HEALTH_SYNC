import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, MessageCircle, User, ArrowLeft } from 'lucide-react';
import { supabase, type Message, type User as UserType } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function DoctorChat() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [patient, setPatient] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && patientId) {
      fetchPatient();
      fetchMessages();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `sender_id=eq.${patientId}`
          }, 
          (payload) => {
            fetchMessages(); // Refresh messages when new one arrives
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, patientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error('Error fetching patient:', error);
      navigate('/doctor/dashboard');
    }
  };

  const fetchMessages = async () => {
    if (!patientId || !user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(full_name, role),
          receiver:users!messages_receiver_id_fkey(full_name, role)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${patientId}),and(sender_id.eq.${patientId},receiver_id.eq.${user.id})`)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !patientId || !user || sending) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: patientId,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(); // Refresh messages
    } catch (error: any) {
      toast.error(error.message || 'Error sending message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-[#F2F2F2] p-8 text-center"
        >
          <MessageCircle className="h-12 w-12 text-[#9E9E9E] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#121212] mb-2">Patient Not Found</h2>
          <p className="text-[#9E9E9E]">
            The patient you're trying to chat with could not be found.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-[#F2F2F2] h-[600px] flex flex-col"
      >
        {/* Chat Header */}
        <div className="p-6 border-b border-[#F2F2F2]">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="p-2 hover:bg-[#F2F2F2] rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-[#9E9E9E]" />
            </button>
            <div className="w-12 h-12 bg-[#6C63FF] rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#121212]">{patient.full_name}</h2>
              <p className="text-[#9E9E9E]">Patient</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-[#9E9E9E] mx-auto mb-4" />
              <p className="text-[#9E9E9E]">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isFromDoctor = message.sender_id === user?.id;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isFromDoctor ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isFromDoctor 
                      ? 'bg-[#6C63FF] text-white' 
                      : 'bg-[#F2F2F2] text-[#121212]'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      isFromDoctor ? 'text-white/70' : 'text-[#9E9E9E]'
                    }`}>
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="p-6 border-t border-[#F2F2F2]">
          <div className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
              disabled={sending}
            />
            <motion.button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-[#6C63FF] text-white rounded-lg hover:bg-[#5A52E8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="h-4 w-4" />
              <span>{sending ? 'Sending...' : 'Send'}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}