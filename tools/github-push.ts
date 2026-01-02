// GitHub Integration - Push to fpresiado/z3e using fetch API
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function githubApi(endpoint: string, method: string = 'GET', body?: any) {
  const token = await getAccessToken();
  const response = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${errorText}`);
  }
  
  return response.json();
}

interface FileToUpload {
  path: string;
  content: string;
}

function getFilesToUpload(): FileToUpload[] {
  const files: FileToUpload[] = [];
  
  const directories = ['enterprise', 'curriculum', 'validators', 'simulations', 'tools', 'docs'];
  
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      const dirFiles = fs.readdirSync(dir);
      for (const file of dirFiles) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isFile()) {
          const content = fs.readFileSync(filePath, 'utf-8');
          files.push({ path: filePath, content });
        }
      }
    }
  }
  
  return files;
}

async function pushToGitHub() {
  const owner = 'fpresiado';
  const repo = 'z3e';
  const branch = 'main';
  
  console.log('Connecting to GitHub...');
  
  try {
    // Get the reference to the main branch
    let refData;
    try {
      refData = await githubApi(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    } catch (e: any) {
      if (e.message.includes('404')) {
        console.log('Main branch not found, getting default branch...');
        const repoInfo = await githubApi(`/repos/${owner}/${repo}`);
        refData = await githubApi(`/repos/${owner}/${repo}/git/ref/heads/${repoInfo.default_branch}`);
      } else {
        throw e;
      }
    }
    
    const latestCommitSha = refData.object.sha;
    console.log('Latest commit SHA:', latestCommitSha);
    
    // Get the tree from the latest commit
    const latestCommit = await githubApi(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`);
    const baseTreeSha = latestCommit.tree.sha;
    
    // Get files to upload
    const files = getFilesToUpload();
    console.log(`Found ${files.length} files to upload`);
    
    // Create blobs for each file
    const treeItems = [];
    for (const file of files) {
      console.log(`Creating blob for: ${file.path}`);
      const blob = await githubApi(`/repos/${owner}/${repo}/git/blobs`, 'POST', {
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64'
      });
      
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
    }
    
    // Create tree
    console.log('Creating tree...');
    const newTree = await githubApi(`/repos/${owner}/${repo}/git/trees`, 'POST', {
      base_tree: baseTreeSha,
      tree: treeItems
    });
    
    // Create commit
    console.log('Creating commit...');
    const newCommit = await githubApi(`/repos/${owner}/${repo}/git/commits`, 'POST', {
      message: 'Phase 1: Enterprise scaffolding and validation - Z3E',
      tree: newTree.sha,
      parents: [latestCommitSha]
    });
    
    // Update reference
    console.log('Updating branch reference...');
    await githubApi(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, 'PATCH', {
      sha: newCommit.sha
    });
    
    console.log('SUCCESS! Pushed to GitHub');
    console.log('Commit SHA:', newCommit.sha);
    console.log(`URL: https://github.com/${owner}/${repo}/commit/${newCommit.sha}`);
    
  } catch (error: any) {
    console.error('Error pushing to GitHub:', error.message);
    process.exit(1);
  }
}

pushToGitHub();
