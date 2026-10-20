import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';
import './App.css';

function App() {
  // --- AUTH STATE ---
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- APP STATE ---
  const [theme, setTheme] = useState('light');
  const [habits, setHabits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [habitName, setHabitName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#ff6b6b");
  const [selectedEmoji, setSelectedEmoji] = useState("🏃");

  const colors = ["#ff6b6b", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"];
  const emojis = ["🏃", "📚", "💧", "🧘", "🥗", "💪", "✍️", "🎨"];

  // --- AUTH EFFECT ---
  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- FETCH HABITS FROM SUPABASE ---
  useEffect(() => {
    if (!session?.user) return;

    const fetchHabits = async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching habits:', error);
      else setHabits(data);
    };

    fetchHabits();
  }, [session]);

  // --- THEME EFFECT ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- HANDLERS ---
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleCreateHabit = async () => {
    if (habitName.trim() === "" || !session?.user) return;

    const { data, error } = await supabase
      .from('habits')
      .insert([{
        user_id: session.user.id,
        name: habitName,
        color: selectedColor,
        emoji: selectedEmoji,
        progress: 0,
        goal: 1
      }])
      .select();

    if (error) {
      console.error('Error creating habit:', error);
    } else {
      setHabits([...habits, ...data]);
      closeModal();
    }
  };

  const updateProgress = async (id, amount) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const newProgress = Math.max(0, habit.progress + amount);

    const { error } = await supabase
      .from('habits')
      .update({ progress: newProgress })
      .eq('id', id);

    if (error) {
      console.error('Error updating habit:', error);
    } else {
      setHabits(habits.map(h => h.id === id ? { ...h, progress: newProgress } : h));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setHabitName("");
    setSelectedColor("#ff6b6b");
    setSelectedEmoji("🏃");
  };

  // --- CALCULATIONS ---
  const totalHabits = habits.length;
  const completedHabits = habits.filter(h => h.progress >= h.goal).length;
  const completionPercentage = totalHabits === 0 ? 0 : Math.round((completedHabits / totalHabits) * 100);

  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - currentDay + i);
      week.push({
        name: day.toLocaleDateString('en-US', { weekday: 'short' }),
        number: day.getDate(),
        isToday: i === currentDay
      });
    }
    return week;
  };
  const weekDays = getWeekDays();

  // --- RENDER LOGIC ---
  if (loadingAuth) {
    return <div className="login-container"><p>Loading...</p></div>;
  }

  if (!session) {
    return <Login />;
  }

  // If logged in, show the app
  return (
    <div className="app-container">
      <nav className="navbar">
        <h1>DailyHabit</h1>
        <div className="nav-buttons">
          <button onClick={() => setIsModalOpen(true)}>+</button>
          <button onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-card">
        <div className="dashboard-text">
          <h2>Let's get started!</h2>
          <p>{completedHabits} of {totalHabits} habits completed</p>
        </div>
        <div className="progress-circle" style={{ '--progress': `${completionPercentage}%` }}>
          <span>{completionPercentage}%</span>
        </div>
      </div>

      <div className="calendar-strip">
        {weekDays.map((day, index) => (
          <div key={index} className={`day-box ${day.isToday ? 'active' : ''}`}>
            <span className="day-name">{day.name}</span>
            <span className="day-number">{day.number}</span>
          </div>
        ))}
      </div>

      <div className="habit-list">
        {habits.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>
            No habits yet. Click the + button to add one!
          </p>
        ) : (
          habits.map(habit => (
            <div key={habit.id} className="habit-card" style={{ '--habit-color': habit.color }}>
              <div className="habit-info">
                <span className="habit-emoji">{habit.emoji}</span>
                <span className="habit-name">{habit.name}</span>
              </div>
              <div className="habit-controls">
                <button onClick={() => updateProgress(habit.id, -1)}>-</button>
                <span>{habit.progress} / {habit.goal}</span>
                <button onClick={() => updateProgress(habit.id, 1)}>+</button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create a new habit</h2>
            <p>Small steps lead to big changes!</p>

            <div className="form-group">
              <label>What's your habit's name? *</label>
              <input 
                type="text" 
                placeholder="Workout, Read book..." 
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label>Choose a color for your habit *</label>
              <div className="color-picker">
                {colors.map(color => (
                  <div 
                    key={color}
                    className={`color-circle ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Pick an emoji to represent your habit *</label>
              <div className="emoji-picker">
                {emojis.map(emoji => (
                  <button 
                    key={emoji}
                    className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
                    onClick={() => setSelectedEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn-create" onClick={handleCreateHabit}>+ Create Habit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;