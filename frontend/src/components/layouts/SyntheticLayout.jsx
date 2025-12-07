import React, { useState } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import SourcePanel from '../panels/SourcePanel';
import DraftPanel from '../panels/DraftPanel';

const ReactGridLayout = WidthProvider(RGL);

const API_URL = 'http://localhost:3001/api';

const SyntheticLayout = ({ project, onUpdate }) => {
    const [isSynthesizing, setIsSynthesizing] = useState(false);

    const layout = [
        { i: 'a', x: 0, y: 0, w: 5, h: 12 },
        { i: 'b', x: 5, y: 0, w: 7, h: 12 },
        { i: 'c', x: 0, y: 12, w: 12, h: 6 }, // Increased height for player
    ];

    const handleGenerateAudio = async () => {
        setIsSynthesizing(true);
        try {
            const response = await fetch(`${API_URL}/generate-audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: project.id }),
            });
            const updatedProject = await response.json();
            // We need to propagate this update up.
            // Since onUpdate usually takes fields, we might need to handle full project replacement or pass the field.
            // But App.jsx's handleUpdateProject takes fields and does a PUT.
            // Here we have the full updated object from the backend (which includes the new audioUrl).
            // We should ideally call a refresh or manually trigger the update.
            // For now, let's just assume the parent component needs to know about the change.
            // However, `onUpdate` defined in App.jsx does a PUT to backend. We don't want to PUT back what we just got.
            // We need a way to `setProject` in the parent.
            // The Workspace re-renders if App state changes.
            // We can hack it by calling onUpdate with the new audioUrl, but that sends a PUT.
            // Better: Reload the project or assume App will refetch? No.

            // Wait, App.jsx handles `onGenerate` by setting state.
            // We should expose `onAudioGenerated` or similar.
            // OR, strictly for this demo, we can force a page reload or use a callback if provided.

            // Let's use `onUpdate` to "save" the URL even though backend already has it? No, that's redundant.
            // The cleanest way without refactoring App.jsx too much is to trigger a fetch or have a `onRefresh` prop.

            // Actually, `onUpdate` in App.jsx updates local state too:
            // setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
            // But it does a fetch PUT first.

            // Let's accept that we might need to refresh the page or add a proper state update mechanism.
            // For now, I'll cheat slightly: window.location.reload() is too harsh.
            // I'll assume the user might switch tabs or I can just pass `onRefresh`?

            // Let's modify App.jsx to pass `onRefresh` or `setProject`? No, too complex.
            // I will use `onUpdate({ audioUrl: updatedProject.audioUrl })`. This sends a PUT to backend with the URL we just got.
            // It's redundant but safe (idempotent) and updates the local UI.
            if (onUpdate) {
                onUpdate({ audioUrl: updatedProject.audioUrl });
            }

        } catch (error) {
            console.error("Audio generation failed", error);
        } finally {
            setIsSynthesizing(false);
        }
    };

    return (
        <ReactGridLayout className="layout" layout={layout} cols={12} rowHeight={30} draggableHandle=".panel h3">
            <div key="a"><SourcePanel project={project} onUpdate={onUpdate} /></div>
            <div key="b"><DraftPanel project={project} title="Script Editor" /></div>
            <div key="c" className="panel" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <h3>Audio Assets</h3>
                {project.generatedContent ? (
                    <div style={{textAlign: 'center', width: '100%', padding: '1rem'}}>
                        {project.audioUrl ? (
                            <div className="audio-player-container">
                                <audio controls src={`http://localhost:3001${project.audioUrl}`} style={{width: '100%'}}>
                                    Your browser does not support the audio element.
                                </audio>
                                <p style={{marginTop: '1rem', fontSize: '0.9rem', color: '#9ca3af'}}>
                                    Generated Audio available.
                                </p>
                                <button
                                    className="generate-btn"
                                    onClick={handleGenerateAudio}
                                    disabled={isSynthesizing}
                                    style={{marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.9rem'}}
                                >
                                    {isSynthesizing ? 'Regenerating...' : 'Regenerate Audio'}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p>Script is ready for synthesis.</p>
                                <button
                                    className="generate-btn"
                                    onClick={handleGenerateAudio}
                                    disabled={isSynthesizing}
                                >
                                    {isSynthesizing ? 'Synthesizing...' : 'Generate Podcast Audio'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <p style={{color: '#6b7280'}}>Generate content first to enable audio synthesis.</p>
                )}
            </div>
        </ReactGridLayout>
    );
};

export default SyntheticLayout;
