import React, { useState, useEffect } from 'react';

const SourcePanel = ({ project, onUpdate }) => {
    const [sourceText, setSourceText] = useState(project.sourceContext || '');

    useEffect(() => {
        setSourceText(project.sourceContext || '');
    }, [project.sourceContext]);

    const handleBlur = () => {
        if (sourceText !== project.sourceContext) {
            onUpdate({ sourceContext: sourceText });
        }
    };

    return (
        <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3>Source Context</h3>
            <textarea 
                style={{ flex: 1, resize: 'none' }}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                onBlur={handleBlur}
                placeholder="Paste your source material here..."
            />
        </div>
    );
};

export default SourcePanel;
