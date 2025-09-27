import { supabase } from '@/lib/supabase'
import { Card } from '@/lib/types'

export async function loadAllCards(): Promise<Card[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('id')
  
  if (error) {
    console.error('Failed to load cards:', error)
    return []
  }
  
  return data.map(row => ({
    id: row.id,
    title: row.title || undefined,
    front: row.front,
    back: row.back,
    frontImages: row.front_images || undefined,
    backImages: row.back_images || undefined,
    group: row.group || undefined,
    path: '' // No longer needed since cards are in DB
  }))
}

export async function saveCard(card: Omit<Card, 'path'>): Promise<boolean> {
  const { error } = await supabase
    .from('cards')
    .upsert({
      id: card.id,
      title: card.title || null,
      front: card.front,
      back: card.back,
      front_images: card.frontImages || null,
      back_images: card.backImages || null,
      group: card.group || null,
      updated_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Failed to save card:', error)
    return false
  }
  
  return true
}

export async function deleteCard(cardId: string): Promise<boolean> {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId)
  
  if (error) {
    console.error('Failed to delete card:', error)
    return false
  }
  
  return true
}
