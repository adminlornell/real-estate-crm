// Simple client-side storage for signed documents
// In a real app, this would be stored in the database

export interface SignedDocument {
  id: string;
  title: string;
  content: string;
  signedBy: string;
  signedAt: string;
  signature: string;
  signingDate: string;
  templateName?: string;
}

const STORAGE_KEY = 'signedDocuments';
const MAX_DOCUMENTS = 10; // Limit to prevent quota issues
const MAX_CONTENT_LENGTH = 50000; // Limit content size

// Utility function to compress/resize image data
function compressImageData(imageData: string, maxWidth: number = 300, maxHeight: number = 100, quality: number = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (!imageData.startsWith('data:image/')) {
      resolve(imageData);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, width, height);
      ctx!.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with compression
      const compressedData = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedData);
    };
    
    img.onerror = () => resolve(imageData);
    img.src = imageData;
  });
}

// Function to compress document content
function compressDocumentContent(content: string): string {
  if (content.length <= MAX_CONTENT_LENGTH) {
    return content;
  }
  
  // Truncate content if too long
  const truncated = content.substring(0, MAX_CONTENT_LENGTH - 100);
  return truncated + '\n\n[Content truncated due to size limitations...]';
}

// Function to compress signature data
async function compressSignatureData(signatureString: string): Promise<string> {
  try {
    const signatures = JSON.parse(signatureString);
    const compressedSignatures: any = {};
    
    for (const [key, signature] of Object.entries(signatures)) {
      if (signature && typeof signature === 'object') {
        const sig = signature as any;
        if (sig.data && sig.data.startsWith('data:image/')) {
          // Compress the signature image
          const compressed = await compressImageData(sig.data, 200, 80, 0.6);
          compressedSignatures[key] = {
            ...sig,
            data: compressed
          };
        } else {
          compressedSignatures[key] = signature;
        }
      }
    }
    
    return JSON.stringify(compressedSignatures);
  } catch (error) {
    console.warn('Failed to compress signature data:', error);
    return signatureString;
  }
}

// Function to clean up old documents to make space
function cleanupOldDocuments(): void {
  try {
    const existing = getSignedDocuments();
    if (existing.length > MAX_DOCUMENTS) {
      // Keep only the most recent documents
      const trimmed = existing
        .sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime())
        .slice(0, MAX_DOCUMENTS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      console.log(`Cleaned up ${existing.length - trimmed.length} old signed documents`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Function to check available storage space
function getStorageInfo(): { used: number; available: number; total: number } {
  try {
    // Estimate storage usage
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    // Most browsers have 5-10MB localStorage limit
    const total = 5 * 1024 * 1024; // Assume 5MB
    const available = total - used;
    
    return { used, available, total };
  } catch (error) {
    return { used: 0, available: 0, total: 0 };
  }
}

export async function saveSignedDocument(doc: Omit<SignedDocument, 'id'>): Promise<SignedDocument> {
  try {
    // First, check storage space
    const storageInfo = getStorageInfo();
    if (storageInfo.available < 500000) { // Less than 500KB available
      console.warn('Low storage space, cleaning up old documents');
      cleanupOldDocuments();
    }

    // Compress the signature data
    const compressedSignature = await compressSignatureData(doc.signature);
    
    // Compress content if needed
    const compressedContent = compressDocumentContent(doc.content);
    
    const signedDoc: SignedDocument = {
      ...doc,
      id: 'signed-' + Date.now(),
      signature: compressedSignature,
      content: compressedContent
    };

    const existing = getSignedDocuments();
    const updated = [signedDoc, ...existing];
    
    // Try to save, with fallback to cleanup if quota exceeded
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (quotaError) {
      console.warn('Storage quota exceeded, performing aggressive cleanup');
      
      // Aggressive cleanup: keep only 5 most recent documents
      const trimmed = existing
        .sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime())
        .slice(0, 5);
      
      const updatedTrimmed = [signedDoc, ...trimmed];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrimmed));
      
      console.log('Successfully saved after cleanup');
    }
    
    return signedDoc;
  } catch (error) {
    console.error('Error saving signed document:', error);
    throw new Error('Failed to save signed document. Storage may be full.');
  }
}

export function getSignedDocuments(): SignedDocument[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading signed documents:', error);
    return [];
  }
}

export function getSignedDocument(id: string): SignedDocument | null {
  const docs = getSignedDocuments();
  return docs.find(doc => doc.id === id) || null;
}

export function deleteSignedDocument(id: string): void {
  const existing = getSignedDocuments();
  const updated = existing.filter(doc => doc.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// Storage management utilities
export function clearAllSignedDocuments(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('All signed documents cleared from storage');
}

export function getStorageUsage(): { documentsCount: number; storageSize: string; storageInfo: ReturnType<typeof getStorageInfo> } {
  const docs = getSignedDocuments();
  const storageInfo = getStorageInfo();
  
  return {
    documentsCount: docs.length,
    storageSize: (storageInfo.used / (1024 * 1024)).toFixed(2) + ' MB',
    storageInfo
  };
}

export function optimizeStorage(): { cleaned: number; sizeBefore: number; sizeAfter: number } {
  const beforeInfo = getStorageInfo();
  const beforeDocs = getSignedDocuments().length;
  
  cleanupOldDocuments();
  
  const afterInfo = getStorageInfo();
  const afterDocs = getSignedDocuments().length;
  
  return {
    cleaned: beforeDocs - afterDocs,
    sizeBefore: beforeInfo.used,
    sizeAfter: afterInfo.used
  };
}