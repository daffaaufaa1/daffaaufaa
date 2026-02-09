import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // GET - List all teachers
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          nit,
          full_name,
          subject,
          created_at,
          updated_at
        `)
        .order('full_name', { ascending: true })

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST - Create teacher
    if (req.method === 'POST') {
      const { nit, full_name, subject, password } = await req.json()

      if (!nit || !full_name || !subject || !password) {
        return new Response(
          JSON.stringify({ error: 'Semua field wajib diisi' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if NIT already exists
      const { data: existingNit } = await supabase
        .from('teachers')
        .select('id')
        .eq('nit', nit)
        .single()

      if (existingNit) {
        return new Response(
          JSON.stringify({ error: 'NIT sudah terdaftar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Hash password
      const { data: hashedPassword } = await supabase.rpc('hash_password', {
        password: password
      })

      const { data, error } = await supabase
        .from('teachers')
        .insert({
          nit,
          full_name,
          subject,
          password_hash: hashedPassword
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data, message: 'Guru berhasil ditambahkan' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT - Update teacher
    if (req.method === 'PUT') {
      const { id, nit, full_name, subject, password } = await req.json()

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID guru wajib diisi' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if NIT already exists for other teacher
      if (nit) {
        const { data: existingNit } = await supabase
          .from('teachers')
          .select('id')
          .eq('nit', nit)
          .neq('id', id)
          .single()

        if (existingNit) {
          return new Response(
            JSON.stringify({ error: 'NIT sudah digunakan guru lain' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      const updateData: Record<string, unknown> = {}
      if (nit) updateData.nit = nit
      if (full_name) updateData.full_name = full_name
      if (subject) updateData.subject = subject
      
      if (password) {
        const { data: hashedPassword } = await supabase.rpc('hash_password', {
          password: password
        })
        updateData.password_hash = hashedPassword
      }

      const { data, error } = await supabase
        .from('teachers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data, message: 'Data guru berhasil diperbarui' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE - Delete teacher
    if (req.method === 'DELETE') {
      const { id } = await req.json()

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID guru wajib diisi' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id)

      if (error) throw error

      return new Response(
        JSON.stringify({ message: 'Guru berhasil dihapus' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin teachers error:', error)
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
