#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('Testing Supabase connection...')
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Has key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  try {
    console.log('Testing connection...')
    const { data, error } = await supabase
      .from('cards')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Connection failed:', error)
      return
    }
    
    console.log('✅ Connection successful!')
    console.log('Current cards count:', data?.length || 0)
    
    // Test inserting a card
    console.log('Testing insert...')
    const { error: insertError } = await supabase
      .from('cards')
      .insert({
        id: 'test_card.md',
        title: 'Test Card',
        front: 'Test front',
        back: 'Test back',
        group: 'test'
      })
    
    if (insertError) {
      console.error('Insert failed:', insertError)
    } else {
      console.log('✅ Insert successful!')
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

test()
