import { useEffect, useState, useCallback } from 'react';

interface MusicNote {
  id: number;
  x: number;
  y: number;
  char: string;
  rotation: number;
  delay: number;
  color: string;
}

export const MusicNotesEffect = () => {
  const [notes, setNotes] = useState<MusicNote[]>([]);
  const [noteIdCounter, setNoteIdCounter] = useState(0);

  const musicNoteChars = ['♪', '♫', '♬', '♩', '♭', '♯', '𝄞'];
  const colors = [
    '#FB7185', // coral red
    '#F59E0B', // yellow/orange
    '#06B6D4', // cyan
    '#14B8A6', // teal
    '#10B981', // emerald/teal
    '#EC4899', // pink
  ];

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const newNote: MusicNote = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
      char: musicNoteChars[Math.floor(Math.random() * musicNoteChars.length)],
      rotation: Math.random() * 360,
      delay: Math.random() * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    setNotes(prev => [...prev, newNote]);
    setNoteIdCounter(prev => prev + 1);

    // Remove the note after animation completes (increased to 6 seconds)
    setTimeout(() => {
      setNotes(prev => prev.filter(note => note.id !== newNote.id));
    }, 6000);
  }, []);

  useEffect(() => {
    // Throttle mouse move events to avoid too many notes
    let lastTime = 0;
    const throttleDelay = 150; // milliseconds - increased to reduce frequency

    const throttledMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTime >= throttleDelay) {
        lastTime = now;
        handleMouseMove(e);
      }
    };

    window.addEventListener('mousemove', throttledMouseMove);

    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
    };
  }, [handleMouseMove]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {notes.map(note => (
        <div
          key={note.id}
          className="absolute music-note"
          style={{
            left: `${note.x}px`,
            top: `${note.y}px`,
            animationDelay: `${note.delay}s`,
            '--rotation': `${note.rotation}deg`,
            '--note-color': note.color,
          } as React.CSSProperties & { '--rotation': string; '--note-color': string }}
        >
          {note.char}
        </div>
      ))}
    </div>
  );
};
