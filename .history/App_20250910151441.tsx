import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AudioTrack, audioTrackDetails } from './types';
import { PlayIcon, StopIcon, FullscreenIcon } from './components/icons';

// --- 파일 설정 ---
// index.html과 같은 폴더에 있는 파일들의 이름을 여기에 입력하세요.
// 파일명이 바뀌면 이 부분만 수정하면 됩니다.
const ASSET_PATHS = {
  flag: '/태극기.jpg', // public 폴더의 태극기 이미지
  [AudioTrack.Salute]: '/국기에_대한_경례(맹세문_성인남자).mp3',
  [AudioTrack.Anthem]: '/애국가_제창(1절).mp3',
  [AudioTrack.Tribute]: '/순국선열_및_호국영령에_대한_묵념.mp3',
  [AudioTrack.SchoolSong]: '/교가_제창.mp3', // 교가 MP3 파일 (추가 필요)
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
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
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

    // 메모리 정리
    useEffect(() => {
        return () => {
            if (schoolSongUrl) {
                URL.revokeObjectURL(schoolSongUrl);
            }
        };
    }, [schoolSongUrl]);

    // 전체화면 상태 감지
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    // 키보드 단축키 처리
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // F1~F4 키로 음원 재생
            switch (e.key) {
                case 'F1':
                    e.preventDefault();
                    togglePlay(AudioTrack.Salute);
                    break;
                case 'F2':
                    e.preventDefault();
                    togglePlay(AudioTrack.Anthem);
                    break;
                case 'F3':
                    e.preventDefault();
                    togglePlay(AudioTrack.Tribute);
                    break;
                case 'F4':
                    e.preventDefault();
                    togglePlay(AudioTrack.SchoolSong);
                    break;
                case 'Escape':
                    // 전체화면 모드에서만 ESC 키 처리
                    if (document.fullscreenElement) {
                        e.preventDefault();
                        document.exitFullscreen();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [togglePlay]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            setSchoolSongFile(file);
            const url = URL.createObjectURL(file);
            setSchoolSongUrl(url);
        } else {
            alert('오디오 파일을 선택해주세요.');
        }
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
            
            // 교가 제창의 경우 선택된 파일 사용
            if (track === AudioTrack.SchoolSong) {
                if (!schoolSongUrl) {
                    // 파일이 선택되지 않은 경우 파일 선택 창 열기
                    fileInputRef.current?.click();
                    return;
                }
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
    
    const handleFullscreen = useCallback(async () => {
        if (!fullscreenRef.current) return;

        try {
            if (!document.fullscreenElement) {
                // 전체화면 모드 진입
                await fullscreenRef.current.requestFullscreen();
                
                // 전체화면 모드 진입 후 브라우저 UI 제거 및 ESC 키만 허용
                setTimeout(() => {
                    // ESC 키 이벤트 리스너 추가
                    const handleKeyDown = (e: KeyboardEvent) => {
                        if (e.key === 'Escape') {
                            document.exitFullscreen();
                        }
                        // 다른 키는 무시
                        e.preventDefault();
                    };
                    
                    // 마우스 클릭 이벤트 방지
                    const handleClick = (e: MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                    };
                    
                    // 컨텍스트 메뉴 방지
                    const handleContextMenu = (e: MouseEvent) => {
                        e.preventDefault();
                    };
                    
                    document.addEventListener('keydown', handleKeyDown);
                    document.addEventListener('click', handleClick, true);
                    document.addEventListener('contextmenu', handleContextMenu);
                    
                    // 전체화면 종료 시 이벤트 리스너 제거
                    const handleFullscreenChange = () => {
                        if (!document.fullscreenElement) {
                            document.removeEventListener('keydown', handleKeyDown);
                            document.removeEventListener('click', handleClick, true);
                            document.removeEventListener('contextmenu', handleContextMenu);
                            document.removeEventListener('fullscreenchange', handleFullscreenChange);
                        }
                    };
                    document.addEventListener('fullscreenchange', handleFullscreenChange);
                }, 200);
            }
        } catch (err: any) {
            alert(`전체 화면 모드를 실행할 수 없습니다: ${err.message} (${err.name})`);
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
                    <div className="relative w-full max-w-lg mx-auto">
                        {/* 태극기 이미지 */}
                        <div 
                            ref={fullscreenRef} 
                            className="relative aspect-[3/2] bg-gray-200 rounded-lg shadow-md overflow-hidden"
                        >
                            <img 
                                src={ASSET_PATHS.flag} 
                                alt="Taegeukgi" 
                                className="w-full h-full object-contain"
                            />
                            
                        </div>
                        
                        {/* 전체화면 버튼 */}
                        <button
                            onClick={handleFullscreen}
                            className="absolute top-3 right-3 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 border border-gray-200"
                            aria-label="태극기 전체 화면으로 보기"
                        >
                            <FullscreenIcon className="w-4 h-4" />
                            <span className="text-xs font-medium hidden sm:inline">전체화면</span>
                        </button>
                    </div>
                    
                    <div className="flex flex-col justify-center space-y-4 max-w-lg mx-auto">
                       {Object.values(AudioTrack).map(track => (
                            <div key={track}>
                                <ControlButton
                                    label={audioTrackDetails[track].label}
                                    onClick={() => togglePlay(track)}
                                    isPlaying={nowPlaying === track}
                                />
                                {track === AudioTrack.SchoolSong && (
                                    <div className="mt-2 text-center">
                                        {schoolSongFile ? (
                                            <p className="text-sm text-green-600 font-medium">
                                                ✓ {schoolSongFile.name}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-500">
                                                MP3 파일을 선택해주세요
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                       ))}
                    </div>

                    {/* 숨겨진 파일 입력 */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* 재생바 - 항상 표시하되 내용을 조건부로 렌더링 */}
                    <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 min-h-[120px] flex flex-col justify-center">
                        {nowPlaying ? (
                            <>
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
                            </>
                        ) : (
                            <div className="text-center text-gray-500">
                                <p className="text-sm">음원을 재생하면 재생바가 표시됩니다</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
