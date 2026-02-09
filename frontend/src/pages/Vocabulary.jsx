import { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { WordCard, Loading, EmptyState, Badge } from '../components/ui';
import api from '../services/api';

export default function Vocabulary() {
    const [words, setWords] = useState([]);
    const [chunks, setChunks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChunk, setSelectedChunk] = useState(null);
    const [filterLevel, setFilterLevel] = useState('all');
    const [selectedWord, setSelectedWord] = useState(null);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        loadData();
    }, [page, selectedChunk]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [wordsResponse, chunksData] = await Promise.all([
                api.getWords(selectedChunk, page, pageSize),
                api.getChunks()
            ]);
            setWords(wordsResponse.items);
            setTotalPages(wordsResponse.pages);
            setTotalItems(wordsResponse.total);
            setChunks(chunksData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredWords = words.filter(word => {
        const matchesSearch =
            word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
            word.bengali_translation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (word.english_translation && word.english_translation.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesLevel = filterLevel === 'all' || (word.grasp_level || 'new') === filterLevel;
        return matchesSearch && matchesLevel;
    });

    if (loading) return <Loading />;

    if (error) {
        return (
            <div className="error-state" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-error)' }}>
                <p>Failed to load vocabulary: {error}</p>
                <button className="btn btn-secondary" onClick={loadData} style={{ marginTop: '16px' }}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="fade-in">
                <header className="page-header">
                    <h1>Vocabulary</h1>
                    <p>Browse and manage your word collection</p>
                </header>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div className="input-group" style={{ flex: 1, minWidth: '250px' }}>
                        <Search className="input-icon" size={18} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search words or meanings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Chunk Filter */}
                    <select
                        className="input"
                        style={{ width: 'auto', paddingLeft: '16px' }}
                        value={selectedChunk || ''}
                        onChange={(e) => {
                            setSelectedChunk(e.target.value ? parseInt(e.target.value) : null);
                            setPage(1);
                        }}
                    >
                        <option value="">All Chunks</option>
                        {chunks.map(chunk => (
                            <option key={chunk.id} value={chunk.id}>
                                Chunk {chunk.chunk_number} ({chunk.word_count} words)
                            </option>
                        ))}
                    </select>

                    {/* Level Filter */}
                    <select
                        className="input"
                        style={{ width: 'auto', paddingLeft: '16px' }}
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                    >
                        <option value="all">All Levels</option>
                        <option value="new">New</option>
                        <option value="learning">Learning</option>
                        <option value="familiar">Familiar</option>
                        <option value="mastered">Mastered</option>
                    </select>
                </div>

                {/* Results Count */}
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Showing {Math.min((page - 1) * pageSize + 1, totalItems)} to {Math.min(page * pageSize, totalItems)} of {totalItems} words
                </p>

                {/* Word Grid */}
                {filteredWords.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        message={searchTerm ? "No words match your search" : "No vocabulary words yet. Import your vocabulary from the backend."}
                    />
                ) : (
                    <div className="word-grid">
                        {filteredWords.map(word => (
                            <WordCard
                                key={word.id}
                                word={word.word}
                                bengali_translation={word.bengali_translation}
                                english_translation={word.english_translation}
                                synonyms={word.synonyms}
                                graspLevel={word.grasp_level || 'new'}
                                correctCount={word.correct_count}
                                onClick={() => setSelectedWord(word)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px', paddingBottom: '32px' }}>
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 10px' }}
                            disabled={page === 1}
                            onClick={() => {
                                setPage(1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="First Page"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 10px' }}
                            disabled={page === 1}
                            onClick={() => {
                                setPage(p => p - 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Previous Page"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 8px', minWidth: '100px', textAlign: 'center' }}>
                            Page {page} of {totalPages}
                        </span>

                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 10px' }}
                            disabled={page === totalPages}
                            onClick={() => {
                                setPage(p => p + 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Next Page"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 10px' }}
                            disabled={page === totalPages}
                            onClick={() => {
                                setPage(totalPages);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Last Page"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                )}
            </div>
            <WordDetailModal selectedWord={selectedWord} setSelectedWord={setSelectedWord} />
        </>
    );
}

// Word Detail Modal moved outside to prevent transform clipping
function WordDetailModal({ selectedWord, setSelectedWord }) {
    if (!selectedWord) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(4px)'
            }}
            onClick={() => setSelectedWord(null)}
        >
            <div
                className="card"
                style={{
                    maxWidth: '500px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{selectedWord.word}</h2>
                    <Badge level={selectedWord.grasp_level || 'new'} />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Translations
                    </h4>
                    <p style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                        {selectedWord.bengali_translation}
                    </p>
                    {selectedWord.english_translation && (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '12px' }}>
                            {selectedWord.english_translation}
                        </p>
                    )}
                </div>

                {selectedWord.example && (
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Example
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '3px solid var(--color-primary)' }}>
                            "{selectedWord.example}"
                        </p>
                    </div>
                )}

                {selectedWord.synonyms && (
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Synonyms
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {selectedWord.synonyms.split(',').map((syn, i) => (
                                <span key={i} style={{ padding: '4px 10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', borderRadius: '4px', fontSize: '13px' }}>
                                    {syn.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Progress
                    </h4>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Correct answers: {selectedWord.correct_count}/3
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Chunk: {selectedWord.chunk_id}
                    </p>
                </div>

                <button
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    onClick={() => setSelectedWord(null)}
                >
                    Close
                </button>
            </div>
        </div>
    );
}
