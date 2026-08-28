'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface LikeButtonProps {
  initialCount: number;
  liked: boolean;
  disabled?: boolean;
  onLike: () => Promise<void>;
}

const colors = ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];

export function LikeButton({ initialCount, liked: initialLiked, disabled, onLike }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [particles, setParticles] = useState<Particle[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync with parent props when they change
  // (keep local state for optimistic UI, but re-sync on prop changes)
  if (initialLiked !== liked && initialCount !== count) {
    setLiked(initialLiked);
    setCount(initialCount);
  }

  const handleLike = async () => {
    if (disabled) return;

    // Optimistic UI: toggle immediately
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    // Particle burst only when liking (not un-liking)
    if (!wasLiked) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 80,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 800);
    }

    // Call API
    try {
      await onLike();
    } catch {
      // Revert on error
      setLiked(wasLiked);
      setCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Particle burst */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{ backgroundColor: particle.color, left: '50%', top: '50%' }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: particle.x, y: particle.y, scale: 0, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Like button */}
      <motion.button
        ref={buttonRef}
        onClick={handleLike}
        disabled={disabled}
        whileTap={{ scale: disabled ? 1 : 1.3 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border
          transition-all duration-200 select-none
          ${liked
            ? 'bg-red-50 border-red-200 text-red-500'
            : 'bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <motion.span
          animate={liked ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 0.3 }}
          className="text-lg"
        >
          {liked ? '❤️' : '🤍'}
        </motion.span>
        <motion.span
          key={count}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-sm font-medium"
        >
          {count}
        </motion.span>
      </motion.button>
    </div>
  );
}

export default LikeButton;
