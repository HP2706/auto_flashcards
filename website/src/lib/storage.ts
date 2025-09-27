import { supabase } from '@/lib/supabase'

export async function uploadImage(file: File, cardId: string, side: 'front' | 'back'): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${cardId}/${side}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('flashcard-images')
      .upload(fileName, file)
    
    if (error) {
      console.error('Error uploading image:', error)
      return null
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('flashcard-images')
      .getPublicUrl(data.path)
    
    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}

export async function deleteImage(url: string): Promise<boolean> {
  try {
    // Extract path from URL
    const urlParts = url.split('/')
    const bucketIndex = urlParts.findIndex(part => part === 'flashcard-images')
    if (bucketIndex === -1) return false
    
    const path = urlParts.slice(bucketIndex + 1).join('/')
    
    const { error } = await supabase.storage
      .from('flashcard-images')
      .remove([path])
    
    if (error) {
      console.error('Error deleting image:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

// Extract image references from markdown content
export function extractImageReferences(markdown: string): string[] {
  const imageRegex = /!\[.*?\]\((.*?)\)/g
  const matches = []
  let match
  
  while ((match = imageRegex.exec(markdown)) !== null) {
    matches.push(match[1])
  }
  
  return matches
}

// Replace local image paths with Supabase URLs in markdown
export function replaceImagePaths(markdown: string, imageMap: Record<string, string>): string {
  let result = markdown
  
  for (const [localPath, supabaseUrl] of Object.entries(imageMap)) {
    result = result.replace(new RegExp(`\\(${escapeRegex(localPath)}\\)`, 'g'), `(${supabaseUrl})`)
  }
  
  return result
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
