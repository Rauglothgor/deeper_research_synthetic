const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const lancedb = require('@lancedb/lancedb');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const textToSpeech = require('@google-cloud/text-to-speech');
const util = require('util');

const app = express();
const PORT = 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Read from environment
const AUDIO_DIR = path.join(__dirname, 'data', 'audio');

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/api/audio', express.static(AUDIO_DIR)); // Serve audio files statically

// --- Database Setup ---
const DB_DIR = 'data/lancedb';
let db;
let projectsTable;

async function initDB() {
    // Ensure data directory exists
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    // Ensure audio directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }

    db = await lancedb.connect(DB_DIR);

    // Check if table exists, if not create it
    const tableNames = await db.tableNames();
    if (tableNames.includes('projects')) {
        projectsTable = await db.openTable('projects');
    } else {
        // Initial schema
        projectsTable = await db.createTable('projects', [
            {
                id: '00000000-0000-0000-0000-000000000000',
                name: 'Placeholder',
                framework: 'None',
                sourceContext: '',
                generatedContent: '',
                audioUrl: '', // New field for audio URL
                createdAt: new Date().toISOString(),
                status: 'Init',
                vector: Array(384).fill(0)
            }
        ]);
        await projectsTable.delete('id = "00000000-0000-0000-0000-000000000000"');
    }
    console.log('LanceDB initialized');
}

initDB().catch(console.error);


// --- Helper Functions ---
function isValidUUID(id) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// --- Embedding Utility (Mock for now) ---
async function generateEmbedding(text) {
    return Array.from({ length: 384 }, () => Math.random());
}

// --- Gemini Generation Service ---
async function generateContent(framework, context, prompt) {
    if (GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro"});

            const fullPrompt = `
                You are an expert analyst.
                Framework: ${framework}
                Context: ${context}

                Task: ${prompt}

                Please provide a structured response adhering to the framework.
            `;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini API Error:", error);
            return `Error calling Gemini API: ${error.message}. Falling back to synthetic generation.`;
        }
    }

    // Mock Generation
    console.log("Using Synthetic Mock Generation");
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (framework === 'PROJECT_DEEPDIVE') {
        return `# Executive Summary\n\nBased on the provided context, the following analysis... \n\n## Key Findings\n\n1. Point A\n2. Point B\n\n## Detailed Analysis\n\n[Synthetic Content generated for ${context.substring(0, 20)}...]`;
    } else if (framework === 'PROJECT_SYNTHETIC') {
        return `TRANSCRIPT: PODCAST EPISODE #42\n\nHost: Welcome back to the show. Today we're discussing...\n\nGuest: It's a fascinating topic because... [Context: ${context.substring(0, 20)}...]`;
    } else {
        return `## Benchmark Report\n\nData indicates a strong correlation between...`;
    }
}

// --- Text-to-Speech Service ---
async function generateAudio(text, filename) {
    // Check for Google Cloud Credentials
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
            const client = new textToSpeech.TextToSpeechClient();
            const request = {
                input: { text: text },
                voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
                audioConfig: { audioEncoding: 'MP3' },
            };
            const [response] = await client.synthesizeSpeech(request);
            const writeFile = util.promisify(fs.writeFile);
            await writeFile(path.join(AUDIO_DIR, filename), response.audioContent, 'binary');
            return `/api/audio/${filename}`;
        } catch (error) {
            console.error('GCP TTS Error:', error);
            console.log('Falling back to placeholder audio.');
        }
    }

    // Fallback: Return placeholder
    // Ensure placeholder exists (downloaded in setup) or serve it.
    // In this plan step we downloaded it to backend/data/audio/placeholder.mp3
    return `/api/audio/placeholder.mp3`;
}


// --- API Routes for Projects ---

// GET /api/projects
app.get('/api/projects', async (req, res) => {
    try {
        if (!projectsTable) return res.status(503).json({ error: 'Database not ready' });
        const projects = await projectsTable.query().limit(100).toArray();
        const cleanProjects = projects.map(({ vector, ...rest }) => rest);
        res.json(cleanProjects);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/projects
app.post('/api/projects', async (req, res) => {
    const { name, framework } = req.body;
    if (!name || !framework) {
        return res.status(400).json({ error: 'Project name and framework are required.' });
    }

    const newProject = {
        id: crypto.randomUUID(),
        name,
        framework,
        sourceContext: '',
        generatedContent: '',
        audioUrl: '',
        createdAt: new Date().toISOString(),
        status: 'New',
        vector: await generateEmbedding('')
    };

    try {
        await projectsTable.add([newProject]);
        const { vector, ...cleanProject } = newProject;
        console.log('Project Created:', cleanProject);
        res.status(201).json(cleanProject);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// GET /api/projects/:id
app.get('/api/projects/:id', async (req, res) => {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'Invalid Project ID' });
    try {
        const results = await projectsTable.query().where(`id = '${req.params.id}'`).limit(1).toArray();
        if (results.length === 0) return res.status(404).json({ error: 'Project not found.' });
        const { vector, ...project } = results[0];
        res.json(project);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/projects/:id
app.put('/api/projects/:id', async (req, res) => {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'Invalid Project ID' });
    try {
        const results = await projectsTable.query().where(`id = '${req.params.id}'`).limit(1).toArray();
        if (results.length === 0) return res.status(404).json({ error: 'Project not found.' });
        const originalProject = results[0];

        const updatedFields = { ...req.body };
        delete updatedFields.id;
        delete updatedFields.vector;

        const updatedProject = { ...originalProject, ...updatedFields };

        if (updatedFields.sourceContext !== undefined && updatedFields.sourceContext !== originalProject.sourceContext) {
            console.log('Regenerating embedding for project:', originalProject.id);
            updatedProject.vector = await generateEmbedding(updatedFields.sourceContext);
        }

        if (updatedProject.vector && !Array.isArray(updatedProject.vector)) {
            updatedProject.vector = Array.from(updatedProject.vector);
        }

        await projectsTable.delete(`id = '${req.params.id}'`);
        await projectsTable.add([updatedProject]);

        const { vector, ...cleanProject } = updatedProject;
        console.log('Project Updated:', cleanProject);
        res.json(cleanProject);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// POST /api/generate
app.post('/api/generate', async (req, res) => {
    const { projectId, prompt } = req.body;
    if (!isValidUUID(projectId)) return res.status(400).json({ error: 'Invalid Project ID' });
    console.log(`Generating for project: ${projectId}`);

    try {
        const results = await projectsTable.query().where(`id = '${projectId}'`).limit(1).toArray();
        if (results.length === 0) return res.status(404).json({ error: 'Project not found' });

        const project = results[0];
        const generatedText = await generateContent(project.framework, project.sourceContext, prompt || 'Analyze this.');

        const updatedProject = { ...project, generatedContent: generatedText, status: 'Generated' };

        if (updatedProject.vector && !Array.isArray(updatedProject.vector)) {
            updatedProject.vector = Array.from(updatedProject.vector);
        }

        await projectsTable.delete(`id = "${projectId}"`);
        await projectsTable.add([updatedProject]);

        const { vector, ...cleanProject } = updatedProject;
        res.json(cleanProject);

    } catch (e) {
        console.log('Generation Error:', e);
        res.status(500).json({ error: 'Generation failed', details: e.toString() });
    }
});

// POST /api/generate-audio
app.post('/api/generate-audio', async (req, res) => {
    const { projectId } = req.body;
    if (!isValidUUID(projectId)) return res.status(400).json({ error: 'Invalid Project ID' });

    try {
        const results = await projectsTable.query().where(`id = '${projectId}'`).limit(1).toArray();
        if (results.length === 0) return res.status(404).json({ error: 'Project not found' });

        const project = results[0];
        if (!project.generatedContent) return res.status(400).json({ error: 'No content to synthesize' });

        console.log(`Synthesizing audio for project: ${projectId}`);
        const filename = `${projectId}.mp3`;
        const audioUrl = await generateAudio(project.generatedContent, filename);

        const updatedProject = { ...project, audioUrl: audioUrl };

        if (updatedProject.vector && !Array.isArray(updatedProject.vector)) {
            updatedProject.vector = Array.from(updatedProject.vector);
        }

        await projectsTable.delete(`id = "${projectId}"`);
        await projectsTable.add([updatedProject]);

        const { vector, ...cleanProject } = updatedProject;
        res.json(cleanProject);

    } catch (e) {
        console.log('Audio Generation Error:', e);
        res.status(500).json({ error: 'Audio generation failed', details: e.toString() });
    }
});

// DELETE /api/projects/:id
app.delete('/api/projects/:id', async (req, res) => {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'Invalid Project ID' });
    try {
        await projectsTable.delete(`id = '${req.params.id}'`);
        res.status(204).send();
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// --- Status ---
app.get('/api/status', async (req, res) => {
    const count = await projectsTable.countRows();
    res.json({ status: 'Backend is running', projectCount: count });
});

app.listen(PORT, () => {
    console.log(`THE FORGE is running on http://localhost:${PORT}`);
    console.log('Awaiting instructions for THE LENS.');
});
