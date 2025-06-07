import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();

export async function uploadImage(file: File): Promise<string> {
  try {
    const uniquePath = `uploads/${crypto.randomUUID()}-${file.name}`
    const imageRef = ref(storage, uniquePath)

    const snapshot = await uploadBytes(imageRef, file)
    const url = await getDownloadURL(snapshot.ref)

    console.log('✅ Image uploaded:', url)
    return url
  } catch (err) {
    console.error('🔥 Upload failed:', err)
    throw err
  }
}
