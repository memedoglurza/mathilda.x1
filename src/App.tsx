import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { ItemCard } from './components/ItemCard';
import { AddEditModal } from './components/AddEditModal';
import { ConfirmModal } from './components/ConfirmModal';
import { AudioButton } from './components/AudioButton';
import { playClickSound } from './utils/audio';
import { getBgClass } from './utils/constants';
import { AppUserData, Level1Item, Level2Item, Level3Item, NavigationPage } from './types';
import { Plus, Hash, FileText, Check, Wifi, WifiOff, Camera, BadgeCheck } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  auth,
  db,
  logoutGoogle,
  saveWorkspaceToFirestore,
  handleFirestoreError,
  OperationType
} from './utils/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userData, setUserData] = useState<AppUserData | null>(null);
  const [pageHistory, setPageHistory] = useState<NavigationPage[]>([]);
  const [currentPage, setCurrentPage] = useState<NavigationPage>({ type: 'login' });

  // Rearranging mode states
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Modal Control States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Item focus state for modals
  const [selectedItemIdForDelete, setSelectedItemIdForDelete] = useState<string | null>(null);
  const [selectedItemNameForDelete, setSelectedItemNameForDelete] = useState('');

  // Local/Online Syncing States
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Monitor Network connection state
  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-Time Firebase Auth & Firestore Subscription Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user.uid);
        
        // Listen to single-document workspace updates securely
        const workspaceDocRef = doc(db, 'workspaces', user.uid);
        const unsubscribeSnapshot = onSnapshot(workspaceDocRef, (docSnap) => {
          // Skip state update if write is still pending locally to prevent cursor-jumping
          if (docSnap.metadata.hasPendingWrites) {
            return;
          }

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              username: data.username || user.displayName || user.email || 'Gezgin',
              profileImage: data.profileImage || user.photoURL || null,
              items: data.items || []
            });
          } else {
            // New user metadata initialization
            const initialWorkspace: AppUserData = {
              username: user.displayName || user.email?.split('@')[0] || 'Gezgin',
              profileImage: user.photoURL || null,
              items: []
            };
            setUserData(initialWorkspace);
            saveWorkspaceToFirestore(user.uid, initialWorkspace.username, [], initialWorkspace.profileImage);
          }
          setIsOfflineMode(!navigator.onLine);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `workspaces/${user.uid}`);
        });

        // Trigger safe home view redirect if returning
        setCurrentPage((prev) => prev.type === 'login' ? { type: 'home' } : prev);
        setIsAuthLoading(false);

        return () => {
          unsubscribeSnapshot();
        };
      } else {
        setCurrentUser(null);
        setUserData(null);
        setCurrentPage({ type: 'login' });
        setPageHistory([]);
        setIsRearrangeMode(false);
        setIsAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Debounced Auto-Save back to Firestore
  useEffect(() => {
    if (!currentUser || !userData) return;

    setIsSyncing(true);
    const timer = setTimeout(async () => {
      try {
        await saveWorkspaceToFirestore(
          currentUser, 
          userData.username, 
          userData.items, 
          userData.profileImage
        );
      } catch (err) {
        console.error('Firestore saving failed:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 1000); // 1.0s debounced updates

    return () => clearTimeout(timer);
  }, [userData, currentUser]);

  const handleLogout = async () => {
    playClickSound('toggle');
    setIsAuthLoading(true);
    try {
      await logoutGoogle();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const saveUserData = (newData: AppUserData) => {
    setUserData(newData);
  };

  // Profile Picture Update
  const handleUpdateProfile = (ignoredName: string, image: string) => {
    if (!userData) return;
    const updated: AppUserData = {
      ...userData,
      profileImage: image,
    };
    saveUserData(updated);
  };

  // Navigations
  const navigateTo = (newNav: NavigationPage) => {
    setPageHistory((prev) => [...prev, currentPage]);
    setCurrentPage(newNav);
    setIsRearrangeMode(false);
  };

  const navigateBack = () => {
    if (pageHistory.length === 0) return;
    const previous = pageHistory[pageHistory.length - 1];
    setPageHistory((prev) => prev.slice(0, prev.length - 1));
    setCurrentPage(previous);
    setIsRearrangeMode(false);
  };

  const navigateToHomePage = () => {
    if (currentPage.type === 'home') return;
    setPageHistory((prev) => [...prev, currentPage]);
    setCurrentPage({ type: 'home' });
    setIsRearrangeMode(false);
  };

  // --- CRUDS FOR EACH LEVEL ---

  // Add Item
  const handleAddItem = (name: string, image: string) => {
    if (!userData) return;

    const updated = { ...userData };

    if (currentPage.type === 'home') {
      const newItem: Level1Item = {
        id: `lvl1-${Date.now()}`,
        name,
        image,
        items: [],
      };
      updated.items.push(newItem);

    } else if (currentPage.type === 'level2') {
      const { val1Id } = currentPage;
      const l1 = updated.items.find(i => i.id === val1Id);
      if (l1) {
        const newItem: Level2Item = {
          id: `lvl2-${Date.now()}`,
          name,
          image,
          items: [],
        };
        l1.items.push(newItem);
      }

    } else if (currentPage.type === 'level3') {
      const { val1Id, val2Id } = currentPage;
      const l1 = updated.items.find(i => i.id === val1Id);
      const l2 = l1?.items.find(i => i.id === val2Id);
      if (l2) {
        const newItem: Level3Item = {
          id: `lvl3-${Date.now()}`,
          name,
          image,
          text: '',
        };
        l2.items.push(newItem);
      }
    }

    saveUserData(updated);
  };

  // Trigger Delete Confirmation dialog
  const triggerDeleteItemDialog = (id: string, name: string) => {
    setSelectedItemIdForDelete(id);
    setSelectedItemNameForDelete(name);
    setIsConfirmModalOpen(true);
  };

  // Performs absolute deletion on confirm
  const handleConfirmDelete = () => {
    if (!userData || !selectedItemIdForDelete) return;

    const updated = { ...userData };

    if (currentPage.type === 'home') {
      updated.items = updated.items.filter(i => i.id !== selectedItemIdForDelete);

    } else if (currentPage.type === 'level2') {
      const { val1Id } = currentPage;
      const l1 = updated.items.find(i => i.id === val1Id);
      if (l1) {
        l1.items = l1.items.filter(i => i.id !== selectedItemIdForDelete);
      }

    } else if (currentPage.type === 'level3') {
      const { val1Id, val2Id } = currentPage;
      const l1 = updated.items.find(i => i.id === val1Id);
      const l2 = l1?.items.find(i => i.id === val2Id);
      if (l2) {
        l2.items = l2.items.filter(i => i.id !== selectedItemIdForDelete);
      }
    }

    saveUserData(updated);
    setSelectedItemIdForDelete(null);
    setSelectedItemNameForDelete('');
  };

  // Text modification inside Level 4 (leaves node editor)
  const handleUpdateLevel4Text = (textVal: string) => {
    if (!userData || currentPage.type !== 'level4') return;

    const { val1Id, val2Id, val3Id } = currentPage;
    const updated = { ...userData };
    const l1 = updated.items.find(i => i.id === val1Id);
    const l2 = l1?.items.find(i => i.id === val2Id);
    const l3 = l2?.items.find(i => i.id === val3Id);

    if (l3) {
      l3.text = textVal;
      saveUserData(updated);
    }
  };

  // Level 3 Alphabetical Sorting (A-Z)
  const handleLevel3Sort = () => {
    if (currentPage.type !== 'level3' || !userData) return;

    const { val1Id, val2Id } = currentPage;
    const updated = { ...userData };
    const l1 = updated.items.find(i => i.id === val1Id);
    const l2 = l1?.items.find(i => i.id === val2Id);

    if (l2) {
      l2.items.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
      saveUserData(updated);
    }
  };

  // --- DRAG AND DROP SWAPPING ---
  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (idx: number) => {
    if (draggedIndex === idx) return;
    setDragOverIndex(idx);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (targetIdx: number) => {
    if (draggedIndex === null || draggedIndex === targetIdx || !userData) return;

    const updated = { ...userData };

    if (currentPage.type === 'home') {
      const itemsCopy = [...updated.items];
      const [draggedItem] = itemsCopy.splice(draggedIndex, 1);
      itemsCopy.splice(targetIdx, 0, draggedItem);
      updated.items = itemsCopy;

    } else if (currentPage.type === 'level2') {
      const { val1Id } = currentPage;
      const l1 = updated.items.find(i => i.id === val1Id);
      if (l1) {
        const itemsCopy = [...l1.items];
        const [draggedItem] = itemsCopy.splice(draggedIndex, 1);
        itemsCopy.splice(targetIdx, 0, draggedItem);
        l1.items = itemsCopy;
      }

    } else if (currentPage.type === 'level3') {
      const { val1Id, val2Id } = currentPage;
      const l1 = updated.items.find(i => i.id === val1Id);
      const l2 = l1?.items.find(i => i.id === val2Id);
      if (l2) {
        const itemsCopy = [...l2.items];
        const [draggedItem] = itemsCopy.splice(draggedIndex, 1);
        itemsCopy.splice(targetIdx, 0, draggedItem);
        l2.items = itemsCopy;
      }
    }

    saveUserData(updated);
    playClickSound('success');
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Screen level loading during active authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 font-sans text-slate-100">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-medium tracking-tight">Portal yükleniyor...</p>
      </div>
    );
  }

  // Visual logon redirect screen
  if (currentPage.type === 'login' || !currentUser) {
    return (
      <LoginScreen 
        onLoginSuccess={(user) => {
          setCurrentUser(user.uid);
        }} 
        isLoading={isAuthLoading} 
        setIsLoading={setIsAuthLoading}
      />
    );
  }

  // Visual screen when user is authenticated but workspace load is pending
  if (!userData) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 font-sans text-slate-100">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-medium tracking-tight">Kişisel verileriniz alınıyor...</p>
      </div>
    );
  }

  // --- SELECTING CURRENT LIST CONTEXT DEPENDING ON ROUTE NAVIGATION ---
  let itemsToRender: any[] = [];
  let currentParentTitle = '';
  let currentParentImage = '';
  let level4TextValue = '';

  if (currentPage.type === 'home') {
    itemsToRender = userData.items;
  } else if (currentPage.type === 'level2') {
    const { val1Id } = currentPage;
    const currentL1 = userData.items.find(i => i.id === val1Id);
    itemsToRender = currentL1 ? currentL1.items : [];
    currentParentTitle = currentL1 ? currentL1.name : '';
    currentParentImage = currentL1 ? currentL1.image : '';
  } else if (currentPage.type === 'level3') {
    const { val1Id, val2Id } = currentPage;
    const currentL1 = userData.items.find(i => i.id === val1Id);
    const currentL2 = currentL1?.items.find(i => i.id === val2Id);
    itemsToRender = currentL2 ? currentL2.items : [];
    currentParentTitle = currentL2 ? currentL2.name : '';
    currentParentImage = currentL2 ? currentL2.image : '';
  } else if (currentPage.type === 'level4') {
    const { val1Id, val2Id, val3Id } = currentPage;
    const currentL1 = userData.items.find(i => i.id === val1Id);
    const currentL2 = currentL1?.items.find(i => i.id === val2Id);
    const currentL3 = currentL2?.items.find(i => i.id === val3Id);
    level4TextValue = currentL3 ? currentL3.text : '';
    currentParentTitle = currentL3 ? currentL3.name : '';
    currentParentImage = currentL3 ? currentL3.image : '';
  }

  const parentBgStyle = currentParentImage && !currentParentImage.startsWith('data:') ? getBgClass(currentParentImage) : '';

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col select-none relative pb-28">
      {/* Interactive header navbar */}
      <Navbar
        currentPage={currentPage.type}
        onBack={navigateBack}
        onHome={navigateToHomePage}
        onLogout={handleLogout}
        onSortAlphabetical={handleLevel3Sort}
      />

      {/* Main Canvas Container */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={JSON.stringify(currentPage)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Level 1 Profile layout */}
            {currentPage.type === 'home' && (
              <div className="w-full bg-slate-900 border border-slate-850 rounded-2xl p-4 flex items-center gap-4 shadow-lg select-none">
                {/* Profile Square avatar */}
                <div
                  onClick={() => {
                    if (!isOfflineMode) {
                      setIsProfileModalOpen(true);
                    }
                  }}
                  className={`group relative w-20 h-20 rounded-xl overflow-hidden shadow-md border bg-slate-950 flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isOfflineMode
                      ? 'border-slate-850 cursor-not-allowed'
                      : 'hover:border-emerald-500/50 cursor-pointer active:scale-95 border-slate-800'
                  }`}
                >
                  {userData?.profileImage && userData.profileImage.startsWith('data:') ? (
                    <img
                      src={userData.profileImage}
                      alt={userData?.username || 'Gezgin'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : userData?.profileImage ? (
                    <div className={`w-full h-full ${getBgClass(userData.profileImage)}`} />
                  ) : (
                    <div className="w-full h-full bg-slate-800" />
                  )}

                  {!isOfflineMode && (
                    <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 py-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[9px] text-slate-300 font-bold font-sans">Değiştir</span>
                    </div>
                  )}
                </div>

                {/* Info labels */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-lg font-bold text-white tracking-tight truncate capitalize">
                      {userData?.username || 'Gezgin'}
                    </h2>
                    <BadgeCheck className={`w-4 h-4 shrink-0 ${isOfflineMode ? 'text-slate-500' : 'text-emerald-400'}`} />
                  </div>
                  <p className="text-xs text-slate-400">
                    Portal Kurucusu • {isOfflineMode ? 'Çevrimdışı Okuma Modu' : 'Bulut Senkronizasyonu Aktif'}
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Kimlik: {userData?.username ? btoa(encodeURIComponent(userData.username)).slice(0, 10).toUpperCase() : 'PORTAL'}
                  </div>
                </div>
              </div>
            )}

            {/* Level 2 & 3 Breadcrumb Header Visual panel (Non-button element) - Larger and distinctive head style */}
            {(currentPage.type === 'level2' || currentPage.type === 'level3') && (
              <div className="w-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800/85 rounded-2xl p-6 flex items-center gap-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />
                <div className="w-16 h-16 rounded-xl overflow-hidden shadow shrink-0 border border-slate-700/80 flex items-center justify-center bg-slate-950">
                  {currentParentImage.startsWith('data:') ? (
                    <img
                      src={currentParentImage}
                      alt={currentParentTitle}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : currentParentImage ? (
                    <div className={`w-full h-full ${parentBgStyle}`} />
                  ) : (
                    <div className="w-full h-full bg-slate-800" />
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest uppercase block">
                    {currentPage.type === 'level2' ? 'İKİNCİ KATMAN' : 'ÜÇÜNCÜ KATMAN'}
                  </span>
                  <h2 className="text-xl font-bold text-white tracking-tight capitalize">
                    {currentParentTitle}
                  </h2>
                </div>
              </div>
            )}

            {/* Level 4 (Record Log) Breadcrumb Header Visual panel - Designed much larger with more graphic placement */}
            {currentPage.type === 'level4' && (
              <div className="w-full bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/25 rounded-2xl p-7 flex flex-col sm:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                
                {/* Visual Square occupying more area */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-emerald-500/20 flex items-center justify-center bg-slate-950">
                  {currentParentImage.startsWith('data:') ? (
                    <img
                      src={currentParentImage}
                      alt={currentParentTitle}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  ) : currentParentImage ? (
                    <div className={`w-full h-full ${parentBgStyle}`} />
                  ) : (
                    <div className="w-full h-full bg-slate-800" />
                  )}
                </div>
                
                <div className="min-w-0 flex-1 text-center sm:text-left space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase">
                    <FileText className="w-3.5 h-3.5" />
                    <span>KAYIT GÜNLÜĞÜ (4. KATMAN)</span>
                  </span>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight capitalize leading-tight">
                    {currentParentTitle}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Seçili parça altında oluşturulmuş nihai içerik dökümü ve kişiselleştirilmiş notlar.
                  </p>
                </div>
              </div>
            )}

            {/* Level List / Grid of items */}
            {currentPage.type !== 'level4' ? (
              <div className="space-y-4">
                {itemsToRender.length === 0 ? (
                  <div className="text-center py-12 px-6 border border-dashed border-slate-900 rounded-2xl bg-slate-900/10">
                    <p className="text-sm text-slate-500 font-semibold font-sans">Bu alanda henüz hiçbir parça bulunamadı.</p>
                    <p className="text-xs text-slate-600 mt-2 font-sans">
                      Aşağıdaki + butonunu kullanarak yeni sayfalar ve parçalar ekleyebilirsiniz.
                    </p>
                  </div>
                ) : currentPage.type === 'level3' ? (
                  /* 3-column Grid specifically for Level 3 grid view */
                  <div className="grid grid-cols-3 gap-3">
                    {itemsToRender.map((item, index) => (
                      <ItemCard
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        image={item.image}
                        index={index}
                        isGrid={true}
                        isRearrangeMode={isRearrangeMode}
                        draggedIndex={draggedIndex}
                        dragOverIndex={dragOverIndex}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        isOffline={isOfflineMode}
                        onSelect={() => navigateTo({
                          type: 'level4',
                          val1Id: (currentPage as any).val1Id,
                          val2Id: (currentPage as any).val2Id,
                          val3Id: item.id
                        })}
                        onLongPress={() => triggerDeleteItemDialog(item.id, item.name)}
                      />
                    ))}
                  </div>
                ) : (
                  /* Single column Row Lists for Level 1 and Level 2 */
                  <div className="flex flex-col gap-3">
                    {itemsToRender.map((item, index) => (
                      <ItemCard
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        image={item.image}
                        index={index}
                        isRearrangeMode={isRearrangeMode}
                        draggedIndex={draggedIndex}
                        dragOverIndex={dragOverIndex}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        isOffline={isOfflineMode}
                        onSelect={() => {
                          if (currentPage.type === 'home') {
                            navigateTo({ type: 'level2', val1Id: item.id });
                          } else {
                            navigateTo({
                              type: 'level3',
                              val1Id: (currentPage as any).val1Id,
                              val2Id: item.id
                            });
                          }
                        }}
                        onLongPress={() => triggerDeleteItemDialog(item.id, item.name)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Level 4 Leaf Content Panel Text Editor */
              <div className="w-full bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold border-b border-slate-800/60 pb-3">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Kişiselleştirilebilir Not ve Bilgi Ekranı</span>
                </div>

                <textarea
                  value={level4TextValue}
                  onChange={(e) => {
                    handleUpdateLevel4Text(e.target.value);
                  }}
                  onFocus={() => playClickSound('click')}
                  placeholder="Seçili parça hakkında notlarınızı buraya yazın. Tüm girdileriniz anında buluta senkronize edilir..."
                  className="w-full h-80 bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl p-4 text-sm font-sans leading-relaxed transition-colors focus:outline-none focus:border-emerald-500/50 resize-none"
                />

                <div className="flex items-center justify-between text-[11px] font-mono px-1">
                  {isOfflineMode ? (
                    <span className="text-amber-400 flex items-center gap-1 font-semibold animate-pulse">
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>Çevrimdışı Mod (Bağlantı Bekleniyor)</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <Wifi className="w-3.5 h-3.5" />
                      <span>Oturum Aktif • {isSyncing ? 'Eşitleniyor...' : 'Senkronize'}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Değişiklikler otomatik kaydedilir</span>
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Buttons at the Bottom of Levels 1, 2, 3 */}
      {currentPage.type !== 'level4' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-5 py-3.5 border border-slate-800 rounded-2xl shadow-2xl select-none">
          {/* Rearranging button # */}
          <AudioButton
            onClick={() => {
              playClickSound('toggle');
              setIsRearrangeMode(!isRearrangeMode);
            }}
            soundType="toggle"
            className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isRearrangeMode
                ? 'bg-emerald-500 border-emerald-400 text-slate-950 scale-110 shadow-lg shadow-emerald-500/20 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 active:scale-95'
            }`}
            title="Sıralama Modu"
          >
            <Hash className="w-5 h-5" />
          </AudioButton>

          {/* Spacer block line */}
          <div className="w-px h-6 bg-slate-800" />

          {/* Add item button + */}
          <AudioButton
            onClick={() => {
              if (isRearrangeMode) {
                setIsRearrangeMode(false);
              }
              setIsAddModalOpen(true);
            }}
            className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 border border-emerald-400/25 text-white rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
            title="Yeni Ekle"
          >
            <Plus className="w-5 h-5 font-extrabold" />
          </AudioButton>
        </div>
      )}

      {/* MODAL OVERLAYS */}

      {/* Edit Profile photo dialog */}
      {isProfileModalOpen && (
        <AddEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onConfirm={handleUpdateProfile}
          title="Kullanıcı Profil Resmi Değiştir"
          initialImage={userData.profileImage || 'grad-1'}
          isProfileEdit={true}
        />
      )}

      {/* Add New Item popup */}
      {isAddModalOpen && (
        <AddEditModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onConfirm={handleAddItem}
          title={
            currentPage.type === 'home'
              ? 'Yeni Çalışma Alanı Ekle'
              : currentPage.type === 'level2'
              ? 'İkinci Katman Parça Ekle'
              : 'Üçüncü Katman Parça Ekle'
          }
        />
      )}

      {/* Delete confirmatory dialog */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedItemNameForDelete}
      />
    </div>
  );
}
