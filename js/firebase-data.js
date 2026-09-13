(function () {
  "use strict";

  const COLLECTION = 'documents';
  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  function dateValue(value) {
    if (!value) return new Date(0);
    if (value.toDate) return value.toDate();
    if (value instanceof Date) return value;
    return new Date(value);
  }

  function normalizeDoc(id, data) {
    return {
      id,
      user_id: data.userId || '',
      name: data.name || data.originalName || '',
      original_name: data.originalName || data.name || '',
      file_name: data.fileName || '',
      storage_path: data.storagePath || '',
      file_type: data.fileType || '',
      mime_type: data.mimeType || 'application/octet-stream',
      file_size: Number(data.fileSize || 0),
      category: data.category || 'other',
      description: data.description || '',
      tags: data.tags || '',
      is_favorite: !!data.isFavorite,
      is_deleted: !!data.isDeleted,
      created_at: dateValue(data.createdAt).toISOString(),
      updated_at: dateValue(data.updatedAt).toISOString(),
      download_url: data.downloadUrl || ''
    };
  }

  async function currentUser() {
    await window.firebaseReady;
    const user = firebaseAuth.currentUser || await getCurrentFirebaseUser();
    if (!user) throw new Error('Please log in again.');
    return user;
  }

  async function getDocuments() {
    const user = await currentUser();
    const snap = await firebaseDb.collection(COLLECTION).where('userId', '==', user.uid).get();
    return snap.docs.map((doc) => normalizeDoc(doc.id, doc.data()));
  }

  async function getDocument(id) {
    const user = await currentUser();
    const snap = await firebaseDb.collection(COLLECTION).doc(id).get();
    if (!snap.exists || snap.data().userId !== user.uid) throw new Error('Document not found.');
    return normalizeDoc(snap.id, snap.data());
  }

  async function uploadDocument(file, fields, onProgress) {
    const user = await currentUser();
    if (!file) throw new Error('Please select a document first.');
    if (file.size > MAX_FILE_SIZE) throw new Error('File is too large. Maximum size is 100 MB.');

    const docRef = firebaseDb.collection(COLLECTION).doc();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `users/${user.uid}/documents/${docRef.id}/${safeName}`;
    const now = firebase.firestore.FieldValue.serverTimestamp();

    const draft = {
      userId: user.uid,
      name: fields.name || file.name,
      originalName: file.name,
      fileName: safeName,
      storagePath,
      fileType: (file.name.split('.').pop() || '').toLowerCase(),
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      category: fields.category || 'other',
      description: fields.description || '',
      tags: fields.tags || '',
      isFavorite: !!fields.favorite,
      isDeleted: false,
      status: 'uploading',
      createdAt: now,
      updatedAt: now
    };

    await docRef.set(draft);

    try {
      const ref = firebaseStorage.ref(storagePath);
      const task = ref.put(file, {
        contentType: file.type || 'application/octet-stream',
        customMetadata: { ownerUid: user.uid, documentId: docRef.id }
      });

      await new Promise((resolve, reject) => {
        task.on(firebase.storage.TaskEvent.STATE_CHANGED,
          (snapshot) => {
            if (onProgress) onProgress(snapshot.totalBytes ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0);
          },
          reject,
          resolve
        );
      });

      const downloadUrl = await ref.getDownloadURL();
      await docRef.update({
        downloadUrl,
        status: 'ready',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return normalizeDoc(docRef.id, { ...draft, downloadUrl, status: 'ready' });
    } catch (error) {
      await docRef.delete().catch(() => {});
      throw error;
    }
  }

  async function toggleFavorite(id) {
    const doc = await getDocument(id);
    await firebaseDb.collection(COLLECTION).doc(id).update({
      isFavorite: !doc.is_favorite,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return !doc.is_favorite;
  }

  async function moveToTrash(id) {
    await getDocument(id);
    await firebaseDb.collection(COLLECTION).doc(id).update({
      isDeleted: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function restoreDocument(id) {
    await getDocument(id);
    await firebaseDb.collection(COLLECTION).doc(id).update({
      isDeleted: false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function permanentlyDelete(id) {
    const doc = await getDocument(id);
    if (doc.storage_path) await firebaseStorage.ref(doc.storage_path).delete().catch(() => {});
    await firebaseDb.collection(COLLECTION).doc(id).delete();
  }

  async function getDownloadUrl(id) {
    const doc = await getDocument(id);
    if (doc.download_url) return doc.download_url;
    if (!doc.storage_path) throw new Error('File storage location is missing.');
    return firebaseStorage.ref(doc.storage_path).getDownloadURL();
  }

  window.DocuFirebase = {
    MAX_FILE_SIZE,
    getDocuments,
    getDocument,
    uploadDocument,
    toggleFavorite,
    moveToTrash,
    restoreDocument,
    permanentlyDelete,
    getDownloadUrl
  };
})();
