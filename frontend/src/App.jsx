import React, { useState, useEffect } from 'react';
import Workspace from './components/Workspace';
import './App.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const API_URL = 'http://localhost:3001/api';

function App() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectFramework, setNewProjectFramework] = useState('PROJECT_DEEPDIVE');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_URL}/projects`);
            const data = await response.json();
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newProjectName, framework: newProjectFramework }),
            });
            const newProject = await response.json();
            setProjects([...projects, newProject]);
            setNewProjectName('');
            setNewProjectFramework('PROJECT_DEEPDIVE');
            setIsCreating(false);
            setSelectedProject(newProject);
        } catch (error) {
            console.error('Error creating project:', error);
        }
    };

    const handleUpdateProject = async (updatedFields) => {
        if (!selectedProject) return;
        try {
            const response = await fetch(`${API_URL}/projects/${selectedProject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFields),
            });
            const updatedProject = await response.json();

            // Update local state
            setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
            setSelectedProject(updatedProject);
        } catch (error) {
            console.error('Error updating project:', error);
        }
    };

    const handleGenerate = async () => {
        if (!selectedProject) return;
        try {
            const response = await fetch(`${API_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: selectedProject.id }),
            });
            const updatedProject = await response.json();
             // Update local state
             setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
             setSelectedProject(updatedProject);
        } catch (error) {
            console.error('Error generating content:', error);
        }
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h1>Initiative: IRONCLAD</h1>
                    <p>Creation Interface</p>
                </div>
                <div className="project-list">
                    {projects.map(p => (
                        <div 
                            key={p.id} 
                            className={`project-item ${selectedProject?.id === p.id ? 'selected' : ''}`}
                            onClick={() => setSelectedProject(p)}
                        >
                            <h3>{p.name}</h3>
                            <p>{p.framework}</p>
                        </div>
                    ))}
                </div>
                <button className="new-project-btn" onClick={() => setIsCreating(true)}>+ New Project</button>
            </aside>

            <main className="main-content">
                <Workspace
                    project={selectedProject}
                    onUpdate={handleUpdateProject}
                    onGenerate={handleGenerate}
                />
            </main>

            {isCreating && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create New Project</h2>
                        <form onSubmit={handleCreateProject}>
                            <label>Project Name</label>
                            <input 
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="e.g., Analysis of Q2 Economic Trends"
                                required
                            />
                            <label>Select Framework</label>
                            <select 
                                value={newProjectFramework}
                                onChange={(e) => setNewProjectFramework(e.target.value)}
                            >
                                <option value="PROJECT_DEEPDIVE">PROJECT DEEPDIVE (TOME)</option>
                                <option value="PROJECT_SYNTHETIC">PROJECT SYNTHETIC (TRANSMISSION)</option>
                                <option value="PROJECT_BENCHMARK">PROJECT BENCHMARK (SNAPSHOT)</option>
                            </select>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsCreating(false)}>Cancel</button>
                                <button type="submit">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
