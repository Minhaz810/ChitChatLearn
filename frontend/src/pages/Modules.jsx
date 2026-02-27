import { useState, useEffect } from 'react';
import { BookOpen, BookText, CheckCircle, Save, Layers } from 'lucide-react';
import Vocabulary from './Vocabulary';
import api from '../services/api';
import { Loading } from '../components/ui';

export default function Modules() {
    const [activeTab, setActiveTab] = useState('VOCABULARY');
    const [currentKnowledgeBase, setCurrentKnowledgeBase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Quran state
    const [surahs, setSurahs] = useState([]);
    const [quranSettings, setQuranSettings] = useState({ sura_no: 1, verse_interval: 5 });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSurah, setSelectedSurah] = useState(null);
    const [tempInterval, setTempInterval] = useState(5);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [kbRes, surahsRes, qSettingsRes] = await Promise.all([
                api.getKnowledgeBase(),
                api.getSurahs(),
                api.getQuranSettings()
            ]);
            setCurrentKnowledgeBase(kbRes.active_module);
            setActiveTab(kbRes.active_module);
            setSurahs(surahsRes);
            setQuranSettings({
                sura_no: qSettingsRes.sura_no,
                verse_interval: qSettingsRes.verse_interval
            });
        } catch (error) {
            console.error("Failed to load modules data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetActiveModule = async (module) => {
        try {
            setSaving(true);
            await api.updateKnowledgeBase({ active_module: module });
            setCurrentKnowledgeBase(module);
        } catch (error) {
            console.error("Failed to set active module", error);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveQuranSettings = async (sura_no, interval) => {
        try {
            setSaving(true);
            const newSettings = { sura_no, verse_interval: interval };
            await api.updateQuranSettings(newSettings);
            setQuranSettings(newSettings);
        } catch (error) {
            console.error("Failed to save Quran settings", error);
        } finally {
            setSaving(false);
        }
    };

    const openSurahModal = (surah) => {
        setSelectedSurah(surah);
        setTempInterval(quranSettings.verse_interval);
        setIsModalOpen(true);
    };

    const submitModal = async () => {
        if (selectedSurah) {
            await handleSaveQuranSettings(selectedSurah.sura_no, tempInterval);
            setIsModalOpen(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <>
            <div className="fade-in">
                <header className="page-header" style={{ marginBottom: '24px' }}>
                    <h1>Modules</h1>
                    <p>Select and configure your active learning module</p>
                </header>

                {/* Module Selector Tabs */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setActiveTab('VOCABULARY')}
                        style={{
                            flex: 1,
                            minWidth: '300px',
                            cursor: 'pointer',
                            padding: '24px',
                            borderRadius: '20px',
                            background: activeTab === 'VOCABULARY' ? 'linear-gradient(145deg, rgba(59,130,246,0.1), rgba(147,51,234,0.05))' : 'var(--bg-card)',
                            border: activeTab === 'VOCABULARY' ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border-color)',
                            boxShadow: activeTab === 'VOCABULARY' ? '0 8px 32px rgba(59,130,246,0.15)' : '0 4px 12px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: activeTab === 'VOCABULARY' ? 'translateY(-4px)' : 'none',
                            textAlign: 'left',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    padding: '14px',
                                    borderRadius: '16px',
                                    background: activeTab === 'VOCABULARY' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                                    color: activeTab === 'VOCABULARY' ? 'white' : 'var(--text-muted)',
                                    boxShadow: activeTab === 'VOCABULARY' ? '0 4px 16px rgba(59,130,246,0.4)' : 'none'
                                }}>
                                    <BookOpen size={28} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px', color: activeTab === 'VOCABULARY' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Vocabulary</h3>
                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Learn and review word meanings</p>
                                </div>
                            </div>
                            {currentKnowledgeBase === 'VOCABULARY' && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: 700, background: 'rgba(16,185,129,0.15)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    <CheckCircle size={16} /> Active
                                </span>
                            )}
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('QURAN')}
                        style={{
                            flex: 1,
                            minWidth: '300px',
                            cursor: 'pointer',
                            padding: '24px',
                            borderRadius: '20px',
                            background: activeTab === 'QURAN' ? 'linear-gradient(145deg, rgba(16,185,129,0.1), rgba(52,211,153,0.05))' : 'var(--bg-card)',
                            border: activeTab === 'QURAN' ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-color)',
                            boxShadow: activeTab === 'QURAN' ? '0 8px 32px rgba(16,185,129,0.15)' : '0 4px 12px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: activeTab === 'QURAN' ? 'translateY(-4px)' : 'none',
                            textAlign: 'left'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    padding: '14px',
                                    borderRadius: '16px',
                                    background: activeTab === 'QURAN' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)',
                                    color: activeTab === 'QURAN' ? 'white' : 'var(--text-muted)',
                                    boxShadow: activeTab === 'QURAN' ? '0 4px 16px rgba(16,185,129,0.4)' : 'none'
                                }}>
                                    <BookText size={28} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px', color: activeTab === 'QURAN' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Quran</h3>
                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Study Surahs and verses</p>
                                </div>
                            </div>
                            {currentKnowledgeBase === 'QURAN' && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: 700, background: 'rgba(16,185,129,0.15)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    <CheckCircle size={16} /> Active
                                </span>
                            )}
                        </div>
                    </button>
                </div>

                {/* Active Module Content */}
                <div style={{ marginTop: '24px' }}>
                    {activeTab === 'VOCABULARY' && (
                        <div className="module-content fade-in">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                {currentKnowledgeBase !== 'VOCABULARY' && (
                                    <button className="btn btn-primary" onClick={() => handleSetActiveModule('VOCABULARY')} disabled={saving}>
                                        Set as Active Module
                                    </button>
                                )}
                            </div>
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                                <Vocabulary />
                            </div>
                        </div>
                    )}

                    {activeTab === 'QURAN' && (
                        <div className="module-content fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Quran Configuration</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Click on a Surah to select it and configure your verse interval.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {currentKnowledgeBase !== 'QURAN' && (
                                        <button className="btn btn-primary" onClick={() => handleSetActiveModule('QURAN')} disabled={saving} style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: 600 }}>
                                            Set as Active Module
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="surah-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                {surahs.map(surah => {
                                    const isSelected = quranSettings.sura_no === surah.sura_no;
                                    return (
                                        <div
                                            key={surah.sura_no}
                                            onClick={() => openSurahModal(surah)}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '20px',
                                                borderRadius: '16px',
                                                border: isSelected ? '2px solid rgba(16,185,129,0.6)' : '1px solid var(--border-color)',
                                                background: isSelected ? 'linear-gradient(145deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))' : 'var(--bg-card)',
                                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                transform: isSelected ? 'translateY(-4px)' : 'none',
                                                boxShadow: isSelected ? '0 8px 24px rgba(16,185,129,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.transform = 'none';
                                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    background: isSelected ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.08)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '15px',
                                                    fontWeight: 700,
                                                    color: isSelected ? '#fff' : 'var(--text-secondary)'
                                                }}>
                                                    {surah.sura_no}
                                                </div>
                                                <span style={{
                                                    fontSize: '12px',
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontWeight: 600,
                                                    background: surah.sura_type === 'Meccan' || surah.sura_type === 'Makki' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                    color: surah.sura_type === 'Meccan' || surah.sura_type === 'Makki' ? '#10b981' : '#f59e0b'
                                                }}>
                                                    {surah.sura_type}
                                                </span>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>{surah.sura_name}</h3>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Layers size={14} /> {surah.total_verses} Verses
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <QuranSettingsModal
                isModalOpen={isModalOpen}
                selectedSurah={selectedSurah}
                tempInterval={tempInterval}
                setTempInterval={setTempInterval}
                setIsModalOpen={setIsModalOpen}
                saving={saving}
                submitModal={submitModal}
            />
        </>
    );
}

// Quran Modal Component moved physically outside to avoid stacking context issues
function QuranSettingsModal({ isModalOpen, selectedSurah, tempInterval, setTempInterval, setIsModalOpen, saving, submitModal }) {
    if (!isModalOpen || !selectedSurah) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999, // Ensure absolute top
            backdropFilter: 'blur(8px)'
        }} onClick={() => setIsModalOpen(false)}>
            <div className="card" style={{
                width: '90%',
                maxWidth: '450px',
                padding: '32px',
                borderRadius: '24px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
                animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'linear-gradient(145deg, var(--bg-card), rgba(0,0,0,0.6))',
                zIndex: 10000
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                    }}>
                        {selectedSurah.sura_no}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1.2 }}>{selectedSurah.sura_name}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{selectedSurah.sura_type} • {selectedSurah.total_verses} Verses</p>
                    </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Verses per session
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={tempInterval}
                            onChange={(e) => setTempInterval(parseInt(e.target.value) || 1)}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: 600,
                                outline: 'none'
                            }}
                        />
                        <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>verses</span>
                    </div>
                    <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Set how many verses you want to learn each time the scheduler triggers an interactive session via Telegram.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        onClick={() => setIsModalOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', transition: 'transform 0.2s', opacity: saving ? 0.7 : 1 }}
                        onMouseEnter={e => !saving && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={e => !saving && (e.currentTarget.style.transform = 'none')}
                        onClick={submitModal}
                        disabled={saving}
                    >
                        {saving ? <Loading size={20} /> : <><Save size={18} /> Save Config</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
