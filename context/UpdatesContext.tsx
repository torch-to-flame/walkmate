import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Updates from 'expo-updates';
import { useFlashMessage } from './FlashMessageContext';

interface UpdatesContextType {
  checkForUpdate: () => Promise<boolean>;
  isCheckingForUpdate: boolean;
  updateAvailable: boolean;
  applyUpdate: () => Promise<void>;
  isApplyingUpdate: boolean;
}

const UpdatesContext = createContext<UpdatesContextType | undefined>(undefined);

export const useUpdates = () => {
  const context = useContext(UpdatesContext);
  if (context === undefined) {
    throw new Error('useUpdates must be used within an UpdatesProvider');
  }
  return context;
};

interface UpdatesProviderProps {
  children: ReactNode;
}

export const UpdatesProvider: React.FC<UpdatesProviderProps> = ({ children }) => {
  const [isCheckingForUpdate, setIsCheckingForUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const { showMessage } = useFlashMessage();

  // Check if the app was launched with an update
  useEffect(() => {
    const checkInitialUpdate = async () => {
      try {
        if (__DEV__) return;
        
        if (Updates.channel === 'production') {
          const updateStatus = await Updates.checkForUpdateAsync();
          setUpdateAvailable(updateStatus.isAvailable);
        }
      } catch (error) {
        console.error('Error checking for initial update:', error);
      }
    };

    checkInitialUpdate();
  }, []);

  // Function to check for updates
  const checkForUpdate = async (): Promise<boolean> => {
    if (__DEV__) {
      showMessage('Updates are disabled in development mode', 'info');
      return false;
    }

    try {
      setIsCheckingForUpdate(true);
      const update = await Updates.checkForUpdateAsync();
      
      setUpdateAvailable(update.isAvailable);
      
      if (update.isAvailable) {
        showMessage('Update available! Pull down to apply.', 'success');
        return true;
      } else {
        showMessage('No updates available', 'info');
        return false;
      }
    } catch (error) {
      console.error('Error checking for update:', error);
      showMessage('Failed to check for updates', 'error');
      return false;
    } finally {
      setIsCheckingForUpdate(false);
    }
  };

  // Function to apply the update
  const applyUpdate = async (): Promise<void> => {
    if (__DEV__) {
      showMessage('Updates are disabled in development mode', 'info');
      return;
    }

    if (!updateAvailable) {
      showMessage('No update available to apply', 'info');
      return;
    }

    try {
      setIsApplyingUpdate(true);
      showMessage('Downloading update...', 'info');
      
      // Fetch the update
      await Updates.fetchUpdateAsync();
      
      // Show a message before restarting
      showMessage('Update downloaded! Restarting app...', 'success');
      
      // Give the message a moment to be seen
      setTimeout(async () => {
        await Updates.reloadAsync();
      }, 1500);
    } catch (error) {
      console.error('Error applying update:', error);
      showMessage('Failed to apply update', 'error');
      setIsApplyingUpdate(false);
    }
  };

  const value = {
    checkForUpdate,
    isCheckingForUpdate,
    updateAvailable,
    applyUpdate,
    isApplyingUpdate,
  };

  return (
    <UpdatesContext.Provider value={value}>
      {children}
    </UpdatesContext.Provider>
  );
};
