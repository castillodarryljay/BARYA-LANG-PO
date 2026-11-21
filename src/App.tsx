import React, { useEffect } from 'react';
import {
  BarChart3,
  BookOpen,
  Film,
  RefreshCw,
  Save,
  Settings,
  Users,
  WifiOff,
} from 'lucide-react';
import { useGameStore, type PlayPanelTab } from './store/gameStore';
import { usePWA } from './hooks/usePWA';
import { soundFX } from './engine/audio';
import { TitleScreen } from './components/screens/TitleScreen';
import { CharacterCreator } from './components/screens/CharacterCreator';
import { EndingsGallery } from './components/screens/EndingsGallery';
import { StoryEditor } from './components/screens/StoryEditor';
import { TopHud } from './components/screens/TopHud';
import { VisualNovelStage } from './components/screens/VisualNovelStage';
import { WeeklyPlanner } from './components/screens/WeeklyPlanner';
import { EndingScreen } from './components/screens/EndingScreen';
import {
  JournalPanel,
  RelationshipsPanel,
  SavesPanel,
  SettingsPanel,
  StatsPanel,
} from './components/screens/SidePanels';
import { MinigameHost } from './components/minigames/MinigameHost';

const NAV_TABS: {
  id: PlayPanelTab;
  label: string;
  labelTl: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'scene', label: 'Play', labelTl: 'Laro', icon: Film },
  { id: 'stats', label: 'Stats', labelTl: 'Stats', icon: BarChart3 },
  { id: 'relationships', label: 'People', labelTl: 'Barkada', icon: Users },
  { id: 'journal', label: 'Journal', labelTl: 'Journal', icon: BookOpen },
  { id: 'saves', label: 'Saves', labelTl: 'Save', icon: Save },
  { id: 'settings', label: 'Settings', labelTl: 'Settings', icon: Settings },
];

export default function App() {
  const {
    screen,
    activeTab,
    save,
    settings,
    toastMessage,
    setActiveTab,
    startAutostartDemo,
    getCurrentNode,
    completeMinigame,
    cancelMinigame,
  } = useGameStore();

  const { isOnline, needRefresh, applyUpdate } = usePWA();

  // Sync audio volumes, BGM style, and rain ambience from persisted settings on load
  useEffect(() => {
    soundFX.setVolumes(settings.bgmVolume, settings.sfxVolume);
    soundFX.setBgmStyle(settings.bgmStyle ?? 'lofi');
    soundFX.setRainAmbience(Boolean(settings.rainAmbience));
  }, [settings.bgmVolume, settings.sfxVolume, settings.bgmStyle, settings.rainAmbience]);

  // Support ?autostart=1 for instant playable test entry
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startAutostartDemo();
    }
  }, [startAutostartDemo]);

  // Expose semantic game phase on document.body.dataset.state
  useEffect(() => {
    if (screen === 'playing' && save) {
      document.body.dataset.state =
        save.phase === 'ending' ? 'gameover' : 'playing';
    } else {
      document.body.dataset.state = 'title';
    }
  }, [screen, save]);

  // Reset scroll to top on view/phase transitions so sticky headers never clip new cards on mobile
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [screen, activeTab, save?.phase, save?.currentNodeId, save?.dayBeat]);

  const isTL = settings.language === 'taglish';
  const currentNode = getCurrentNode();

  const renderMainStage = () => {
    if (!save) return null;
    if (save.phase === 'ending') {
      return <EndingScreen />;
    }
    if (save.phase === 'minigame' && save.pendingMinigameId) {
      return (
        <MinigameHost
          minigameId={save.pendingMinigameId}
          language={settings.language}
          onComplete={(ratio, passed) =>
            completeMinigame(save.pendingMinigameId!, ratio, passed)
          }
          onCancel={cancelMinigame}
        />
      );
    }
    if (save.phase === 'vn' && currentNode) {
      return <VisualNovelStage node={currentNode} />;
    }
    return <WeeklyPlanner />;
  };

  const renderActivePanel = (tab: PlayPanelTab) => {
    switch (tab) {
      case 'stats':
        return <StatsPanel />;
      case 'relationships':
        return <RelationshipsPanel />;
      case 'journal':
        return <JournalPanel />;
      case 'saves':
        return <SavesPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return renderMainStage();
    }
  };

  return (
    <div className="min-h-screen bg-[#18110c] text-amber-50 selection:bg-amber-500/30 overflow-x-clip">
      {/* Compact SW update or offline notice (only rendered when triggered) */}
      {(needRefresh || !isOnline) && (
        <div className="bg-[#2a1d13] border-b border-amber-700/50 px-4 py-1.5 text-xs flex items-center justify-center gap-3 text-amber-200">
          {!isOnline && (
            <span className="inline-flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              Offline Mode — Playing 100% locally
            </span>
          )}
          {needRefresh && (
            <button
              type="button"
              onClick={applyUpdate}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500 text-[#1b110a] font-bold"
            >
              <RefreshCw className="w-3 h-3" />
              Update available — Reload
            </button>
          )}
        </div>
      )}

      {screen === 'title' && <TitleScreen />}
      {screen === 'char_create' && <CharacterCreator />}
      {screen === 'gallery' && <EndingsGallery />}
      {screen === 'editor' && <StoryEditor />}

      {screen === 'playing' && save && (
        <div className="min-h-screen flex flex-col">
          <TopHud />

          {/* Desktop 12-column workspace + Mobile single-column stage */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-5 pt-4 pb-20 lg:pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Primary Game Stage (Mounted once: always visible on desktop; switches via tab on mobile) */}
              <div className="lg:col-span-8">
                <div className={activeTab === 'scene' ? 'block' : 'hidden lg:block'}>
                  {renderMainStage()}
                </div>
                {activeTab !== 'scene' && (
                  <div className="lg:hidden">{renderActivePanel(activeTab)}</div>
                )}
              </div>

              {/* Desktop Persistent Side Companion Rail */}
              <aside className="hidden lg:flex lg:col-span-4 flex-col gap-3">
                <nav
                  aria-label="Game companion panels"
                  className="grid grid-cols-5 gap-1 bg-[#221711] p-1 rounded-xl border border-amber-800/50"
                >
                  {NAV_TABS.filter((t) => t.id !== 'scene').map((tab) => {
                    const Icon = tab.icon;
                    const desktopTab =
                      activeTab === 'scene' ? 'stats' : activeTab;
                    const active = desktopTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`min-h-[42px] px-1.5 py-1.5 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 transition-colors ${
                          active
                            ? 'bg-amber-500 text-[#1b110a]'
                            : 'text-amber-200/80 hover:bg-[#2d1f16]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="truncate max-w-full">
                          {isTL ? tab.labelTl : tab.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>

                <div className="max-h-[calc(100vh-148px)] overflow-y-auto pr-1">
                  {renderActivePanel(
                    activeTab === 'scene' ? 'stats' : activeTab
                  )}
                </div>
              </aside>
            </div>
          </main>

          {/* Compact Mobile & Tablet Bottom Navigation Bar */}
          <nav
            aria-label="Mobile navigation"
            className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#1c130e]/95 border-t border-amber-800/50 px-1.5 pt-1 pb-safe"
          >
            <div className="grid grid-cols-6 gap-1 max-w-xl mx-auto">
              {NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-h-[48px] rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                      active
                        ? 'bg-amber-500 text-[#1b110a]'
                        : 'text-amber-200/75 hover:bg-[#2a1d15]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate">
                      {isTL ? tab.labelTl : tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* Non-intrusive Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 right-4 z-50 bg-[#261a12] border border-amber-500/70 text-amber-100 px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm font-semibold"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
