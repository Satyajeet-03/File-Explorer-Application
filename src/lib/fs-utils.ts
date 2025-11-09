export interface File {
  type: 'file';
  name: string;
  content: string;
  size: number;
  permissions: string; // e.g., '644'
}

export interface Directory {
  type: 'directory';
  name: string;
  children: FSEntity[];
  permissions: string; // e.g., '755'
}

export type FSEntity = File | Directory;

const homeDirectory: Directory = {
  type: 'directory',
  name: '~',
  permissions: '755',
  children: [
    {
      type: 'directory',
      name: 'Documents',
      permissions: '755',
      children: [
        { type: 'file', name: 'report.docx', content: 'This is a secret report.', size: 2450, permissions: '644' },
        { type: 'file', name: 'notes.txt', content: 'Remember to buy milk.', size: 1200, permissions: '644' },
      ],
    },
    {
      type: 'directory',
      name: 'Pictures',
      permissions: '755',
      children: [
        { type: 'file', name: 'vacation.jpg', content: 'Image data...', size: 120240, permissions: '644' },
        {
          type: 'directory',
          name: 'Old',
          permissions: '755',
          children: [
            { type: 'file', name: 'archive.zip', content: 'Zip data...', size: 500000, permissions: '644' }
          ]
        }
      ],
    },
     {
      type: 'directory',
      name: '.config',
      permissions: '700',
      children: [
        { type: 'file', name: 'settings.json', content: '{}', size: 2, permissions: '600' }
      ],
    },
    { type: 'file', name: 'README.md', content: 'Welcome to the Linux Console Explorer!', size: 120, permissions: '644' },
    { type: 'file', name: 'main.cpp', content: '#include <iostream>', size: 2048, permissions: '644' },
  ],
};

const root: Directory = {
    type: 'directory',
    name: '/',
    permissions: '755',
    children: [homeDirectory],
};


export const getInitialFileSystem = (): Directory => JSON.parse(JSON.stringify(root));


export const resolvePath = (currentPath: string, targetPath: string): string => {
  if (targetPath.startsWith('/')) {
    return targetPath;
  }
  if (targetPath === '~') {
    return '~';
  }
  const parts = currentPath.split('/').filter(p => p);
  const targetParts = targetPath.split('/').filter(p => p);

  for (const part of targetParts) {
    if (part === '.') continue;
    if (part === '..') {
      if (parts.length > 1) { // Can't go above ~
        parts.pop();
      }
    } else {
      parts.push(part);
    }
  }

  let finalPath = parts.join('/');
  if (currentPath === '~' && targetPath !== '..') {
     if(targetPath.startsWith('..')) {
         finalPath = '~'
     } else {
        finalPath = `~/${targetParts.join('/')}`;
     }
  } else if (currentPath.startsWith('~/') && parts.length > 0) {
      finalPath = '~/' + parts.slice(1).join('/');
  }
  
  if (finalPath === '' || finalPath === '~') return '~';
  if (!finalPath.startsWith('~/') && !finalPath.startsWith('/')) return `~/${finalPath}`;
  
  // Normalize path by removing trailing slashes unless it's the root
  if(finalPath.length > 1 && finalPath.endsWith('/')) {
      finalPath = finalPath.slice(0, -1);
  }

  return finalPath;
};

export const findNodeByPath = (path: string, fs: Directory): FSEntity | null => {
  if (path === '/' || path === '~') return fs.name === path ? fs : fs.children.find(c => c.name === '~') as Directory;

  const parts = path.replace(/^~\/?/, '').split('/').filter(p => p);
  let currentNode: FSEntity | undefined = fs.children.find(c => c.name === '~');

  if (!currentNode) return null;

  for (const part of parts) {
    if (currentNode.type === 'directory') {
      currentNode = currentNode.children.find(c => c.name === part);
      if (!currentNode) return null;
    } else {
      return null;
    }
  }
  return currentNode || null;
};


export const getParentAndName = (path: string, fs: Directory): { parent: Directory | null, name: string } => {
    const parts = path.split('/');
    const name = parts.pop() || '';
    const parentPath = parts.join('/') || (path.startsWith('/') ? '/' : '');

    const parent = findNodeByPath(parentPath === '' ? (path.startsWith('~/') ? '~' : '/') : parentPath, fs) as Directory | null;
    return { parent, name };
};


export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

export const formatPermissions = (mode: string): string => {
  const permChars = ['r', 'w', 'x'];
  let result = '';
  for (let i = 0; i < 3; i++) {
    const digit = parseInt(mode[i], 10);
    result += (digit & 4) ? permChars[0] : '-';
    result += (digit & 2) ? permChars[1] : '-';
    result += (digit & 1) ? permChars[2] : '-';
  }
  return result;
};
