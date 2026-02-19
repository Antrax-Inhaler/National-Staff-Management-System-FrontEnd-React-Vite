// src/components/ui/VideoPlayer.tsx (minimalist)
import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Modal from './Modal';
import { formatFileSize, formatDuration } from '../../src/utils/fileUtils';

interface VideoPlayerProps {
  video: {
    id: number | string;
    url: string;
    name: string;
    size?: number;
    type?: string;
    thumbnail?: string;
    duration?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  showInfo?: boolean;
  autoPlay?: boolean;
}

export default function VideoPlayer({
  video,
  isOpen,
  onClose,
  showInfo = false,
  autoPlay = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    return formatDuration(seconds);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(video.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = video.name || 'video';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        handlePlayPause();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'm':
        e.preventDefault();
        toggleMute();
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (videoRef.current && isOpen) {
      if (autoPlay) {
        videoRef.current.play().catch((err) => {
          console.error('Auto-play failed:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [isOpen, autoPlay]);

  if (!isOpen || !video) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-6xl h-[80vh]"
      showCloseButton={false}
    >
      <div
        ref={containerRef}
        className="flex flex-col h-full bg-black relative group"
      >
        {/* Simple Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/90">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white"
              title="Close"
            >
              <X size={20} />
            </button>
            <span className="text-sm text-gray-300 truncate">
              {video.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 text-gray-400 hover:text-white"
              title="Download"
            >
              <Download size={18} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-gray-400 hover:text-white"
              title="Fullscreen"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative flex-1 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Loading...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="mt-3 text-gray-400">Failed to load video</p>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            src={video.url}
            poster={video.thumbnail}
            className="w-full h-full object-contain"
            onLoadedData={() => {
              setIsLoading(false);
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
              }
            }}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load video');
            }}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onEnded={() => setIsPlaying(false)}
            onClick={handlePlayPause}
          />

          {/* Minimal Controls */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Progress Bar */}
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer 
                  [&::-webkit-slider-thumb]:appearance-none 
                  [&::-webkit-slider-thumb]:h-3 
                  [&::-webkit-slider-thumb]:w-3 
                  [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-gray-300"
              />
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayPause}
                    className="p-1.5 text-white hover:bg-white/10 rounded"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="p-1.5 text-gray-300 hover:text-white"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX size={18} />
                      ) : (
                        <Volume2 size={18} />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer 
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:h-3 
                        [&::-webkit-slider-thumb]:w-3 
                        [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:bg-gray-300"
                    />
                  </div>

                  <span className="text-sm text-gray-400">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Info (Optional) */}
        {showInfo && (
          <div className="px-4 py-3 bg-black border-t border-gray-800">
            <div className="text-xs text-gray-500">
              Space: Play/Pause • F: Fullscreen • M: Mute • Esc: Close
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}