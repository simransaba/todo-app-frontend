import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Share2, Plus, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from './components/alert';
import { Button } from './components/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/card';
import { Input } from './components/input';
import axios from 'axios';

// Configure axios base URL for localhost
const api = axios.create({
  baseURL: 'http://localhost:5000',  // Changed to localhost
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for security headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for token handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const TodoApp = () => {
  // State management
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  // Check for existing token on mount
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    setIsLoggedIn(true);
    fetchTodos();
  }
}, []);

  // Alert helper
  const showAlertMessage = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  // Authentication functions
  const handleRegister = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/register', { username, password });
      localStorage.setItem('token', response.data.token);
      setIsLoggedIn(true);
      showAlertMessage('Registration successful');
      await fetchTodos();
    } catch (error) {
      console.error('Registration error:', error);
      showAlertMessage(error.response?.data?.error || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/login', { username, password });
      localStorage.setItem('token', response.data.token);
      setIsLoggedIn(true);
      showAlertMessage('Login successful');
      await fetchTodos();
    } catch (error) {
      showAlertMessage(error.response?.data?.error || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setTodos([]);
    setUsername('');
    setPassword('');
    showAlertMessage('Logged out successfully');
  };

  // Todo functions
  const fetchTodos = async () => {
    try {
      const response = await api.get('/api/todos');
      setTodos(response.data);
    } catch (error) {
      showAlertMessage('Error fetching todos', 'error');
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    try {
      const response = await api.post('/api/todos', { text: newTodo });
      setTodos([...todos, response.data]);
      setNewTodo('');
      showAlertMessage('Todo added successfully');
    } catch (error) {
      showAlertMessage('Error adding todo', 'error');
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      await api.put(`/api/todos/${id}`, { completed: !completed });
      setTodos(todos.map(todo =>
        todo._id === id ? { ...todo, completed: !completed } : todo
      ));
    } catch (error) {
      showAlertMessage('Error updating todo', 'error');
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo._id);
    setEditText(todo.text);
  };

  const saveTodoEdit = async () => {
    if (!editText.trim()) return;

    try {
      await api.put(`/api/todos/${editingId}`, { text: editText });
      setTodos(todos.map(todo =>
        todo._id === editingId ? { ...todo, text: editText } : todo
      ));
      setEditingId(null);
      setEditText('');
      showAlertMessage('Todo updated successfully');
    } catch (error) {
      showAlertMessage('Error updating todo', 'error');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await api.delete(`/api/todos/${id}`);
      setTodos(todos.filter(todo => todo._id !== id));
      showAlertMessage('Todo deleted successfully');
    } catch (error) {
      showAlertMessage('Error deleting todo', 'error');
    }
  };

  const copyShareableLink = async (todo) => {
    try {
      // Modified to use localhost URL
      const shareableLink = `http://localhost:3000/todo/${todo._id}`;
      await navigator.clipboard.writeText(shareableLink);
      showAlertMessage('Link copied to clipboard');
    } catch (error) {
      showAlertMessage('Error copying link', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {alert.show && (
          <Alert className={`mb-4 ${alert.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        {!isLoggedIn ? (
          <Card>
            <CardHeader>
              <CardTitle>{showRegister ? 'Register' : 'Login'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
                <Button
                  className="w-full"
                  onClick={showRegister ? handleRegister : handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : (showRegister ? 'Register' : 'Login')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowRegister(!showRegister)}
                  disabled={isLoading}
                >
                  {showRegister ? 'Back to Login' : 'Need to Register?'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Todo List</CardTitle>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Add a new todo"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  />
                  <Button onClick={addTodo}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {todos.map(todo => (
                    <div
                      key={todo._id}
                      className={`flex items-center justify-between p-2 rounded ${
                        todo.completed ? 'bg-gray-100' : 'bg-white'
                      } border`}
                    >
                      {editingId === todo._id ? (
                        <div className="flex-1 flex space-x-2">
                          <Input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={saveTodoEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={() => toggleTodo(todo._id, todo.completed)}
                              className="h-4 w-4"
                            />
                            <span 
                              className={`${todo.completed ? 'line-through text-gray-500' : ''} truncate max-w-[300px]`}
                              title={todo.text}
                            >
                              {todo.text}
                            </span>
                          </div>
                          <div className="flex space-x-2 ml-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyShareableLink(todo)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(todo)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteTodo(todo._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TodoApp;