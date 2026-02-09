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

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // GET - List all students
    if (req.method === 'GET') {
      const classId = url.searchParams.get('class_id')
      
      let query = supabase
        .from('students')
        .select(`
          id,
          nis,
          full_name,
          class_id,
          created_at,
          updated_at
        `)
        .order('full_name', { ascending: true })

      if (classId) {
        query = query.eq('class_id', classId)
      }

      const { data, error } = await query

      if (error) throw error

      // Get class names
      const { data: classes } = await supabase.from('classes').select('id, name')
      const classMap = new Map(classes?.map(c => [c.id, c.name]) || [])

      const studentsWithClass = data?.map(s => ({
        ...s,
        class_name: s.class_id ? classMap.get(s.class_id) : null
      }))

      return new Response(
        JSON.stringify({ data: studentsWithClass }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST - Create student
    if (req.method === 'POST') {
      const { nis, full_name, class_id, password } = await req.json()

      if (!nis || !full_name || !class_id || !password) {
        return new Response(
          JSON.stringify({ error: 'Semua field wajib diisi' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check class student count (max 35)
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', class_id)

      if (count && count >= 35) {
        return new Response(
          JSON.stringify({ error: 'Kelas sudah penuh (maksimal 35 siswa)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if NIS already exists
      const { data: existingNis } = await supabase
        .from('students')
        .select('id')
        .eq('nis', nis)
        .single()

      if (existingNis) {
        return new Response(
          JSON.stringify({ error: 'NIS sudah terdaftar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Hash password
      const { data: hashedPassword } = await supabase.rpc('hash_password', {
        password: password
      })

      const { data, error } = await supabase
        .from('students')
        .insert({
          nis,
          full_name,
          class_id,
          password_hash: hashedPassword
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data, message: 'Siswa berhasil ditambahkan' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT - Update student
    if (req.method === 'PUT') {
      const { id, nis, full_name, class_id, password } = await req.json()

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID siswa wajib diisi' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if NIS already exists for other student
      if (nis) {
        const { data: existingNis } = await supabase
          .from('students')
          .select('id')
          .eq('nis', nis)
          .neq('id', id)
          .single()

        if (existingNis) {
          return new Response(
            JSON.stringify({ error: 'NIS sudah digunakan siswa lain' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      const updateData: Record<string, unknown> = {}
      if (nis) updateData.nis = nis
      if (full_name) updateData.full_name = full_name
      if (class_id) updateData.class_id = class_id
      
      if (password) {
        const { data: hashedPassword } = await supabase.rpc('hash_password', {
          password: password
        })
        updateData.password_hash = hashedPassword
      }

      const { data, error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data, message: 'Data siswa berhasil diperbarui' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE - Delete student
    if (req.method === 'DELETE') {
      const { id } = await req.json()

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID siswa wajib diisi' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)

      if (error) throw error

      return new Response(
        JSON.stringify({ message: 'Siswa berhasil dihapus' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin students error:', error)
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
