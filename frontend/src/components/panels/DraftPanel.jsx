import React from 'react';

const DraftPanel = ({ project, title = 'Outline & Draft' }) => {
    return (
        <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3>{title}</h3>
            <textarea 
                style={{ flex: 1, resize: 'none' }}
                readOnly
                value={project.generatedContent || ''}
                placeholder={`Generated content for ${project.framework} will appear here...`}
            />
        </div>
    );
};

export default DraftPanel;
