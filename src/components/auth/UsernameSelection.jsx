import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const UsernameSelection = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUserUsername, user } = useAuth();
  const navigate = useNavigate();

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Check if username exists in Supabase
      const exists = await setUserUsername(username);
      
      if (exists) {
        setError('This username is already taken. Please choose another one.');
        return;
      }

      // Username successfully set
      toast.success('Username set successfully!');
      navigate('/');
    } catch (err) {
      console.error('Error setting username:', err);
      if (err.message && err.message.includes('does not exist')) {
        setError('There was an issue with the database. Please try again later.');
      } else {
        setError(err.message || 'An error occurred while setting username');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <Card className="w-full max-w-md p-8 bg-neutral-900 border border-neutral-800 rounded-lg">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Choose Your Username
        </h1>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500 rounded-md text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleUsernameSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <div className="mt-1">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full"
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-400">
            Your username will be used to identify you in the app. It can only contain letters, numbers, and underscores.
          </div>
          
          <Button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Setting username...
              </span>
            ) : (
              'Set Username'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default UsernameSelection;
