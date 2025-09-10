import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AudioTrack, audioTrackDetails } from './types';
import { PlayIcon, StopIcon, FullscreenIcon } from './components/icons';

// --- 파일 설정 ---
// index.html과 같은 폴더에 있는 파일들의 이름을 여기에 입력하세요.
// 파일명이 바뀌면 이 부분만 수정하면 됩니다.
const ASSET_PATHS = {
  flag: './file/태극기.jpg', // file 폴더의 태극기 이미지
  [AudioTrack.Salute]: './file/국기에_대한_경례(맹세문_성인남자).mp3',
  [AudioTrack.Anthem]: './file/애국가_제창(1절).mp3',
  [AudioTrack.Tribute]: './file/순국선열_및_호국영령에_대한_묵념.mp3',
  [AudioTrack.SchoolSong]: './file/교가_제창.mp3', // 교가 MP3 파일 (추가 필요)
};
// -----------------

interface ControlButtonProps {
    label: string;
    onClick: () => void;
    isPlaying: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({ label, onClick, isPlaying }) => {
    const Icon = isPlaying ? StopIcon : PlayIcon;
    
    const baseClasses = "w-full flex items-center justify-center gap-3 text-lg font-bold py-4 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-md hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    const stateClasses = isPlaying
        ? "bg-rose-600 text-white border border-rose-600 hover:bg-rose-700 focus:ring-rose-500"
        : "bg-white text-slate-800 border border-slate-200 hover:bg-blue-600 hover:text-white focus:ring-blue-500";

    return (
        <button 
            onClick={onClick}
            className={`${baseClasses} ${stateClasses}`}
        >
            <Icon className="w-6 h-6" />
            <span>{label}</span>
        </button>
    );
};

const App: React.FC = () => {
    const [nowPlaying, setNowPlaying] = useState<AudioTrack | null>(null);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [schoolSongFile, setSchoolSongFile] = useState<File | null>(null);
    const [schoolSongUrl, setSchoolSongUrl] = useState<string>('');
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fullscreenRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        audioRef.current = new Audio();
        const audio = audioRef.current;
        
        const handleAudioEnd = () => {
            setNowPlaying(null);
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('ended', handleAudioEnd);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.pause();
            audio.removeEventListener('ended', handleAudioEnd);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, []);

    const togglePlay = useCallback((track: AudioTrack) => {
        if (!audioRef.current) return;
        const audio = audioRef.current;

        if (nowPlaying === track) {
            audio.pause();
            setNowPlaying(null);
            setIsPlaying(false);
        } else {
            if (!audio.paused) {
                audio.pause();
            }
            
            // 교가 제창의 경우 업로드된 파일 사용
            if (track === AudioTrack.SchoolSong && schoolSongUrl) {
                audio.src = schoolSongUrl;
            } else {
                audio.src = ASSET_PATHS[track];
            }
            
            audio.play().catch(e => console.error("Audio play failed:", e));
            setNowPlaying(track);
            setCurrentTime(0);
        }
    }, [nowPlaying, schoolSongUrl]);

    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const audio = audioRef.current;
        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    }, []);

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    
    const handleFullscreen = useCallback(() => {
        if (!fullscreenRef.current) return;

        if (!document.fullscreenElement) {
            fullscreenRef.current.requestFullscreen().catch(err => {
                alert(`전체 화면 모드를 실행할 수 없습니다: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 font-sans">
            <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 space-y-8">
                <header className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-800">학교 행사 진행</h1>
                    <p className="text-gray-500 mt-2">원활한 행사 진행을 위한 보조 도구입니다.</p>
                </header>

                <main className="space-y-8">
                    <div 
                        ref={fullscreenRef} 
                        onClick={handleFullscreen}
                        className="relative aspect-[3/2] bg-gray-200 rounded-lg shadow-md cursor-pointer group overflow-hidden w-full max-w-lg mx-auto"
                        aria-label="태극기 전체 화면으로 보기"
                        role="button"
                        tabIndex={0}
                    >
                        <img 
                            src={ASSET_PATHS.flag} 
                            alt="Taegeukgi" 
                            className="w-full h-full object-contain" // object-cover 에서 object-contain 으로 변경하여 이미지가 잘리지 않도록 함
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                            <FullscreenIcon className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                    </div>
                    
                    <div className="flex flex-col justify-center space-y-4 max-w-lg mx-auto">
                       {Object.values(AudioTrack).map(track => (
                            <ControlButton
                                key={track}
                                label={audioTrackDetails[track].label}
                                onClick={() => togglePlay(track)}
                                isPlaying={nowPlaying === track}
                            />
                       ))}
                    </div>

                    {/* 재생바 */}
                    {nowPlaying && (
                        <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {audioTrackDetails[nowPlaying].label}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {isPlaying ? '재생 중' : '일시정지'}
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                {/* 진행바 */}
                                <div className="relative">
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 0}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                        style={{
                                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
                                        }}
                                    />
                                </div>
                                
                                {/* 시간 표시 */}
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;
