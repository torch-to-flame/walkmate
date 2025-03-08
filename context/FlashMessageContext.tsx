import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

type MessageType = 'success' | 'error' | 'info';

interface FlashMessage {
  message: string;
  type: MessageType;
  id: number;
}

interface FlashMessageContextType {
  showMessage: (message: string, type: MessageType) => void;
  messages: FlashMessage[];
}

const FlashMessageContext = createContext<FlashMessageContextType | undefined>(undefined);

export const useFlashMessage = () => {
  const context = useContext(FlashMessageContext);
  if (context === undefined) {
    throw new Error('useFlashMessage must be used within a FlashMessageProvider');
  }
  return context;
};

interface FlashMessageProviderProps {
  children: ReactNode;
}

export const FlashMessageProvider: React.FC<FlashMessageProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<FlashMessage[]>([]);
  const [nextId, setNextId] = useState(0);

  const showMessage = (message: string, type: MessageType) => {
    const id = nextId;
    setNextId(id + 1);
    
    setMessages(prev => [...prev, { message, type, id }]);
    
    // Auto-remove the message after 3 seconds
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== id));
    }, 3000);
  };

  const value = {
    showMessage,
    messages,
  };

  return (
    <FlashMessageContext.Provider value={value}>
      {children}
      {messages.length > 0 && (
        <View style={styles.container}>
          {messages.map((msg) => (
            <View 
              key={msg.id} 
              style={[
                styles.messageContainer, 
                msg.type === 'error' && styles.errorContainer,
                msg.type === 'success' && styles.successContainer,
                msg.type === 'info' && styles.infoContainer,
              ]}
            >
              <Text style={styles.messageText}>{msg.message}</Text>
            </View>
          ))}
        </View>
      )}
    </FlashMessageContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorContainer: {
    backgroundColor: '#ffcccc',
    borderLeftWidth: 5,
    borderLeftColor: '#ff0000',
  },
  successContainer: {
    backgroundColor: '#d4edda',
    borderLeftWidth: 5,
    borderLeftColor: '#28a745',
  },
  infoContainer: {
    backgroundColor: '#d1ecf1',
    borderLeftWidth: 5,
    borderLeftColor: '#17a2b8',
  },
  messageText: {
    color: '#333',
    fontSize: 16,
  },
});
