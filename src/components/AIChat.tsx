import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
  Divider,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  ExpandLess,
  ExpandMore,
  FitnessCenter,
  Restaurant,
  Schedule,
  Help
} from '@mui/icons-material';
import { vertexAIService } from '../services/vertexAIService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactElement;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'exercise-recommendation',
    label: 'Exercise Recommendations',
    icon: <FitnessCenter />,
    prompt: 'I need exercise recommendations for building muscle. Can you suggest some effective exercises with proper form tips?'
  },
  {
    id: 'workout-plan',
    label: 'Workout Plan',
    icon: <Schedule />,
    prompt: 'Help me create a workout plan. I can work out 3-4 days per week and want to build strength and muscle.'
  },
  {
    id: 'nutrition-advice',
    label: 'Nutrition Advice',
    icon: <Restaurant />,
    prompt: 'I need nutrition advice for muscle building and recovery. What should I focus on in my diet?'
  },
  {
    id: 'general-help',
    label: 'General Help',
    icon: <Help />,
    prompt: 'I have questions about fitness and training. Can you help me understand the basics?'
  }
];

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI fitness trainer. I can help you with exercise recommendations, workout plans, nutrition advice, and answer any fitness questions you have. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<any[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string = inputValue) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Convert messages to Vertex AI format
      const vertexMessages = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Add the new user message
      vertexMessages.push({
        role: 'user',
        parts: [{ text: message.trim() }]
      });

      const response = await vertexAIService.sendMessage(message.trim(), vertexMessages);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response from AI');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.prompt);
    handleSendMessage(action.prompt);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your AI fitness trainer. I can help you with exercise recommendations, workout plans, nutrition advice, and answer any fitness questions you have. How can I assist you today?",
        timestamp: new Date()
      }
    ]);
    chatHistoryRef.current = [];
    setError(null);
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        width: isExpanded ? 400 : 60, 
        height: isExpanded ? 600 : 60,
        borderRadius: isExpanded ? 2 : '50%',
        transition: 'all 0.3s ease-in-out',
        zIndex: 1000,
        overflow: 'hidden',
        bgcolor: 'background.paper'
      }}
    >
      {!isExpanded ? (
        <IconButton
          onClick={() => setIsExpanded(true)}
          sx={{ 
            width: '100%', 
            height: '100%',
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          <SmartToy sx={{ fontSize: 24 }} />
        </IconButton>
      ) : (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            bgcolor: 'primary.main', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToy />
              <Typography variant="h6" fontWeight="bold">
                AI Trainer
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setIsExpanded(false)}
              sx={{ color: 'white' }}
            >
              <ExpandMore />
            </IconButton>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ m: 1, mb: 0 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Quick Actions */}
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Quick Actions:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {QUICK_ACTIONS.map((action) => (
                <Chip
                  key={action.id}
                  icon={action.icon}
                  label={action.label}
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickAction(action)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider />

          {/* Messages */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 1,
            maxHeight: 350
          }}>
            <List dense>
              {messages.map((message) => (
                <ListItem key={message.id} sx={{ 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  pb: 2
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 1,
                    width: '100%'
                  }}>
                    <ListItemIcon sx={{ minWidth: 'auto' }}>
                      {message.role === 'user' ? (
                        <Person color="primary" />
                      ) : (
                        <SmartToy color="secondary" />
                      )}
                    </ListItemIcon>
                    <Typography variant="caption" color="text.secondary">
                      {message.role === 'user' ? 'You' : 'AI Trainer'} • {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Paper 
                    elevation={1}
                    sx={{ 
                      p: 2, 
                      bgcolor: message.role === 'user' ? 'primary.light' : 'grey.100',
                      color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                      maxWidth: '100%',
                      wordBreak: 'break-word'
                    }}
                  >
                    <ListItemText 
                      primary={message.content}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        sx: { whiteSpace: 'pre-wrap' }
                      }}
                    />
                  </Paper>
                </ListItem>
              ))}
              {isLoading && (
                <ListItem>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartToy color="secondary" />
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      AI Trainer is typing...
                    </Typography>
                  </Box>
                </ListItem>
              )}
            </List>
            <div ref={messagesEndRef} />
          </Box>

          <Divider />

          {/* Input */}
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Ask me about exercises, workouts, nutrition..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                size="small"
                variant="outlined"
              />
              <IconButton
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                color="primary"
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled'
                  }
                }}
              >
                <Send />
              </IconButton>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Press Enter to send, Shift+Enter for new line
              </Typography>
              <IconButton 
                size="small" 
                onClick={clearChat}
                sx={{ color: 'text.secondary' }}
              >
                <Typography variant="caption">Clear</Typography>
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

